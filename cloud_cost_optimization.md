![LiquidXLogo.png](./img/LiquidXLogoDarkBg.png)

---

# A continual process
Designing and provisioning cloud architecture now a days have become quite easy often can be done by click of mouse.  However, the flipside of that convenience is the rising cost that could often become prohibitive for a startup or medium-size organization.  In this article, we discuss a few processes and steps we have found useful in keeping the infrastructure cost down.  Keep in mind that the cost-saving measures are seldom a one-off engagement, the team and the organization needs to commit to the cost-saving measures continually to have a significant dent in the overall infrastructure bill.

# Steps toward optimizing cloud cost

## Tag everything
The first step toward cost-saving would be to tag every architecture component with the team or project they are provisioned for.

## Establish periodic review of the infrastructure
They key to optimizing cloud cost is to take detail accounting and review all cost of your cloud services.  Due to the fast nature of development and ship cycle of a startup, cloud cost often tend to creep higher overtime.  A periodic review should be done to:
- Ensure that the established cost-saving procedures are being followed
- Perform cost-saving operations or decisions

## Enforce compliance
For a medium to large organizations, there could be a team of users who have the ability to create or delete infrastructure.  Which implies, over time, mistakes will be made, cost will keep creeping up.  The most effective way to enforce compliance is to adhere to the rule of zero-tolerance: e.g., delete all infrastructure components that do not have the required team/project tag.

## Use containerization to achieve scalability
Use of containerization technology such as Kubernetes will provide more control over how the architecture scales up and down with varying load.

## Switch to ARM-64
Replacing the Intel or AMD-64 processor architecture (e.g., [AWS Graviton2](https://aws.amazon.com/ec2/graviton/)) with Arm-64 architecture machines can potentially 15-20% savings of cost and may significantly reduce the total infrastructure cost.