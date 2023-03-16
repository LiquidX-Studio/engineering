# Optimizing NestJS App Memory Usage in Kubernetes

> Author: [Amjad Hossain](https://www.linkedin.com/in/md-amjad-hossain-rahat/)

Modern web applications require reliable and scalable infrastructure to handle user traffic, and Amazon Web Services (AWS) offers a robust cloud platform for hosting applications. In this context, we discuss the challenges we faced while running our Node.js app developed in NestJS framework on an Amazon Elastic Kubernetes Service (EKS) cluster with multiple nodes, behind a load balancer and Web Application Firewall (WAF). Our application was memory-intensive, which led to high costs and scalability issues. In this article, we explain the problem we faced that led us to explore the optimization strategies we employed to improve memory usage and reduce costs and explain the steps here that we had gone through.

## Problem that we faced
To solve some of our business problems, we developed one web service(web api) and three worker services(background services) using NestJS framework. We have three different active environments(Dev, RC and Prod) where we are running these services. Our dockerfile was as follows

```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY . .

RUN yarn add @nestjs/cli
RUN yarn install && yarn build

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000

# Expose port
EXPOSE $PORT

# Start app
CMD [ "yarn", "run", "start" ]
```

as you can see, in dockerfile the CMD executes a command that is written to the package.json file. And the command is `"start": "nest start"`. It was our first mistake that we ran nestjs command to start the app. This command is helpful for development and debugging but not recommended for production environment. So we moved to following command

```dockerfile
CMD ["node", "dist/main.js"]
```

But the probem we were facing was same, that is the app taking too much memory. If we set the memory limit of pod to 1GB the app causes [JavaScript heap out of memory](https://felixgerschau.com/javascript-heap-out-of-memory-error/) during startup. To be safe side we set the memory limit to `2GB`.

As we have 1 web-api-service and 3 worker-service and we want to keep 2 instance of each service for load balancing. So we had to allocate `(2x4 x2GB=) 16GB` of memory. Also we have 3 different active environments(Dev, RC and Production). So In total we had to allocate `(3 x16GB=) 48GB` of memory. That's a huge amount of memory compared to the business problem we are solving!!

## How we attacked the problem to solve


### Memory profiling
At first we thought it's memory leak issue of the application, otherwise these small app cannot take that much of memory. So we ran memory profiling. You can check the [article](./NestJS%20memory%20profiler%20documentation.md) to know how we did the memory profiling of our nestjs app.

After memory profiling we found that our application is hardly taking 100MB of memory for different stage and cases. So we started checking memory management of nodejs app and v8 engine. We found following two link very helpful
1. https://medium.com/geekculture/node-js-default-memory-settings-3c0fe8a9ba1
2. https://stackoverflow.com/questions/72123632/how-to-get-back-to-point-0-of-memory-consumption-with-nestjs

### Deafult heap memory size of nodejs app
There is no official documentation we found for the memory nodejs app takes. But we found in several places that the memory it takes vary from 1GB to 4GB depending on nodejs version and host OS architecture(32bit or 64bit). For our case it was taking 1GB on startup. As the heap-size is nearly 1GB and our applications does not take that much memory at all so GC does not start its action.

### Customizing heap-size of nodejs app
Based on our memory profiling we set the max heap size as 200MB and memory limit for pod was set to 300. The app started running successfully with this memory allocation. In production we had to do some fine tuning for different services for real usages. The tricky setting is `--max-old-space-size=200` parameter when we execute the command to start the application.

### Update config files

#### 1. Updated Dockerfile

The first step to optimizing the memory usage of your NestJS application is to update your Dockerfile. You can use the following Dockerfile as a reference:

```dockerfile
# Set base image
FROM node:14-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# Copy source code
COPY . .

# Build app
RUN yarn build

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000

# Expose port
EXPOSE $PORT

# Start app
CMD ["node", "--max-old-space-size=200", "dist/main.js"]
```

In this Dockerfile, we are using the **node:14-alpine** as the base image, which is a lightweight version of NodeJS. We are also using Yarn instead of NPM for package management, which can help reduce the size of your Docker image also Yarn is preferable over NPM for better security purpose as NPM is open source.

We are setting the **--max-old-space-size** flag to 200 when starting our application, which sets the maximum heap size for our NestJS application. This is based on the memory profiler results, which showed that the application uses only 150MB of memory. If we do not set the **--max-old-space-size**, then the default heap size would be 900MB+ and the node of your cluster cannot start without less than 1024MB of memory, where your application might be using 200MB hardly. The number in MB mentioned here varies on NodeJS version.

### 2. Reduce Node Memory Limit in Kubernetes

Next, we need to reduce the memory limit of our NestJS application in Kubernetes. We can do this by modifying our Kubernetes deployment configuration.

Here's an example of how to set the memory limit to 256 MB when deploying your NestJS application to Kubernetes:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nestjs-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nestjs-app
  template:
    metadata:
      labels:
        app: nestjs-app
    spec:
      containers:
        - name: nestjs-app
          image: your-nestjs-image:latest
          resources:
            limits:
              memory: "256Mi"
            requests:
              memory: "256Mi"
```

In this example, we are setting the memory limit to 256 MB for our NestJS application container by specifying **memory: "256Mi"** in the **resources** section of our Kubernetes deployment configuration.

## Monitor Application Memory Usage

Once you have updated your Dockerfile and Kubernetes deployment configuration, you can deploy your NestJS application to Kubernetes and monitor its memory usage using a memory profiler.

You can use the built-in memory profiler in NodeJS by running your application with the **--inspect** flag, and then connecting to the profiler using the Chrome DevTools. Alternatively, you can use a third-party memory profiler like **heapdump**,  **v8-profiler** or **v8**.

By monitoring your application's memory usage, you can identify any memory leaks or other performance issues and optimize your application accordingly.

## Troubleshoot Out-of-Memory Errors

If you are still experiencing memory related errors even after optimizing the memory usage of your NestJS application, you may need to do further memory profiling to know exact memory limit of your application in Kubernetes.

However, be aware that reducing the memory limit too much may cause your application to crash or experience degraded performance.

## Conclusion

By following these steps, you can optimize the memory usage of your NestJS application running in Kubernetes and reduce resource consumption, improve performance, and prevent out-of-memory errors.