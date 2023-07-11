![LiquidXLogo.png](./img/LiquidXLogo.png)

# Optimizing NestJS App Memory Usage in Kubernetes

> Author: [Amjad Hossain](https://www.linkedin.com/in/md-amjad-hossain-rahat/)

Modern web applications require reliable and scalable infrastructure to handle user traffic, and Amazon Web Services (AWS) offers a robust cloud platform for hosting applications. In this context, we discuss the challenges we faced while running our Node.js app developed in NestJS framework on an Amazon Elastic Kubernetes Service (EKS) cluster with multiple nodes, behind a load balancer and Web Application Firewall (WAF). Our application was memory-intensive, which led to high costs and scalability issues. In this article, we explain the problem we faced that led us to explore the optimization strategies we employed to improve memory usage and reduce costs and explain the steps here that we had gone through.

# Our services and environments
For our web3 app, we developed one web service(web api) and three worker services (background services) using NestJS framework. We have three different active environments(Dev, RC and Prod) where we are running these services. Our dockerfile was as follows:

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

> We have changed our start command to `CMD ["node", "dist/main.js"]` instead of `"start": "nest start"` since it is more suitable for production deployment.

## Memory footprint
We were facing [JavaScript heap out of memory](https://felixgerschau.com/javascript-heap-out-of-memory-error/) error during startup if we set the memory limit of each pod to `1GB`.  So, we had to set the memory limit to `2GB`.  

To summarize, we had:
- `4` services 
- `2` instances of each service
- `2GB` memory for each instance
- `3` environments (dev, release, production)
- Total memory required by the Kubernetes cluster was: `4x2x2GBx3 = 48GB`


## Memory profiling
As the first step, we ran memory profiling [memory profiling steps](./NestJS%20memory%20profiler%20documentation.md) for our apps and found that our apps were utilizing around `100MB` of memory.  This finding ruled out memory leaks and bugs.

> You can use the built-in memory profiler in NodeJS by running your application with the `--inspect` flag, and then connecting to the profiler using the Chrome DevTools. Alternatively, you can use a third-party memory profiler like `heapdump`,  `v8-profiler` or `v8`

## Default heap memory size of nodejs app and the GC
Node js apps' memory requirement varies from 1GB to 4GB depending on nodejs version and host OS architecture(32bit or 64bit). For our case it was taking 1GB on startup. As the heap-size is nearly 1GB and our apps require around `100MB`, so GC does not initialize and the app continues with the initial `2GB` allocated memory.

## Customizing heap-size of nodejs app
Based on our memory profiling we set the max heap size as `200MB` and memory limit for pod was set to `300MB`. The app started running successfully with this memory allocation. 

> In the production environment we had to change the following setting:  `--max-old-space-size=200`

# Memory optimization
## 1. Update configuration (Dockerfile)

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

- We are using the `node:14-alpine` as the base image, which is a lightweight version of NodeJS
- We are also using Yarn instead of NPM for package management to reduce the size of the docker image
- We set the `--max-old-space-size` flag to `200` when starting our application, which sets the maximum heap size for our NestJS application
  - Otherwise, the default heap size would be `900MB+` and the node of your cluster cannot start without less than `1024MB` of memory. The number in MB mentioned here varies on NodeJS version.

## 2. Reduce Node Memory Limit in Kubernetes
We reduced the memory limit of our NestJS app in Kubernetes by modifying our deployment configuration:

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

In this example, we are setting the memory limit to `256 MB` for our NestJS application container by specifying `memory: "256Mi"` in the `resources` section of our Kubernetes deployment configuration.

# Conclusion
The steps described above has helped us reduce our total memory footprint to `~ 4x2x512MBx3 = 12GB` a total saving of `75%`.  Memory optimization is a continual process and it is usually necessary to periodically monitor and optimize the infrastructure and application code.

# References
1. [Node js default memory settings](https://medium.com/geekculture/node-js-default-memory-settings-3c0fe8a9ba1)
2. [Nest js memory consumption](https://stackoverflow.com/questions/72123632/how-to-get-back-to-point-0-of-memory-consumption-with-nestjs)
