# minitoco Service

Explain your service here.

# Development setup

Currently, I only have instructions for Mac OSX. If you want instructions for linux, it should be pretty easy as well. Instead of colima, use minikube. Instead of brew, use whatever package manager you use. On Windows, you should use Docker Desktop and follow Docker's instructions.

## Mac OSX
The following process takes a few minutes--especially on an older device. Homebrew is required for these instructions to work. If you don't have homebrew, install that first.

1. Generate your local public/private keys:
    ```bash
    # The following keys are only relevant to your local instance
    mkdir -p keys
    openssl genrsa -out keys/private-key.pem 3072
    openssl rsa -in keys/private-key.pem -pubout -out keys/public-key.pem
    ```
    These keys are used by the service to generate a 
2. Configure your .env
    ```bash
    echo 'NODE_ENV=development' >> .env.local
    echo 'DB_NAME=minitoco' >> .env.local
    echo 'DB_USERNAME=user' >> .env.local
    echo 'DB_PASSWORD=password' >> .env.local
    echo 'DB_HOST=minitoco-postgres' >> .env.local
    echo 'DB_PORT=5432' >> .env.local
    echo 'DATABASE_URL="postgresql://user:password@localhost:5450/minitoco?schema=public"' >> .env.local
    echo 'DB_CONNECT_SSL=false' >> .env.local
    echo 'HOST="http://localhost:3050"' >> .env.local
    echo 'CLIENT_HOST="http://localhost:3051"' >> .env.local
    rm .env
    ln -s .env.local .env
    ```
    > *NOTE*:
    > The fact that the host and port are different in the .env file and the
    > docker-compose.yml file (as well as the other env variables) is intended.
    > This allows you to run migrations and seed operations from your dev
    > computer, but allows the containers to talk to one another.
3. Ensure, hyperkit/qemu, colima, docker, and docker-compose are installed
    ```bash
    # Install packages
    if [ "$(uname -m)" == "x86_64" ]; then
      brew install hyperkit
    else  # hyperkit not supported on arm64
      brew install qemu
    fi
    brew install docker docker-compose kubectl colima
    colima start

    # After this, you will have a daemon up and running that will be able to run
    # the app and mount the volumes.
    ```
4. Fill out the [prisma schema](prisma/schema.prisma)
5. Fill out the DB [seed file](prisma/seed.ts)
6. Run Docker Compose in dev environment
    ```bash
    docker-compose up
    ```
7. Migrate and seed the database
    ```bash
    npx prisma migrate dev
    npx prisma db seed
    ```
You should now have the minitoco service running at localhost:3050. If you don't want to block your terminal, use the `-d` option. However, I like to block that terminal window and run another terminal.

# Automatically detecting changes

The docker container runs nodemon in the development environment that monitors any change you make to the [src](src/) directory. Any change that you save in that directory will cause your service to get restarted.

# Automated testing

npm run test:unit

# Manual Testing

This section supposes that you have followed the development setup steps. Testing manually is key to understanding how the auth service works. You can test manually via http://localhost:3050/docs

# Database

The database we're using is Postgres. We connect to the database using the pg package. Our tool of choice is [Prisma](https://www.prisma.io) as an ORM for this project.

## Running a migration

`npx prisma migrate dev`

## Seeding the database  (optional--depends upon if your project needs to seed the database)

`npx prisma db seed`

## Tools

### General visualizer and query tool
[PG Admin](https://www.pgadmin.org/) is a good general tool tool for administering Postgres databases. You can also use the psql command line tool.

On mac, you can install with homebrew: `brew install pgadmin4`

## Configuration
There are four environment variables you can change:
* DB_USERNAME
* DB_PASSWORD
* DB_NAME
* DB_HOST
These environment variables (with the exception of DB_HOST) are used for each environment.

We use the dotenv npm package for reading our environment variables.


# How does it work?

## Assumptions

As is the case with many projects, you have to make assumptions and pick a direction to start moving. The following assumptions were made:

### The minimal unit of a toco is 0.0001

Why did I choose this? I looked at total number of dollars in circulation. As of Dec. 2022, it was $2.3 trillion. The BIGINT data type in postgress stores this range: -9,223,372,036,854,775,808 to +9,223,372,036,854,775,807, and thus, is sufficient for most transactions we might do. I wanted to choose a type with a width that was big enough to store a reasonable amount of toco as an integer so that the database could do math without having to use string and then deserialize to a Big and write the math into the code to be accurate. I feel this is a reasonable assumption for the purposes of this project, but perhaps a real-world project would require more accuracy (perhaps using a BigQuotient data type, having an integer numerator and denominator that can grow aritrarily large).

Thus, if a calculation ever requires rounding, I'll round HALF_UP to the nearest 0.0001 minitoco.

### The server is authoritative at all times

This runs directly against the section of the document I was sent about the tech enabled product and organization:

> *Who are our customers and what problems are wer solving for them?*
> Primarily our customers include:
> * Payees, i.e. merchants both small and large (can be multi outlet merchants as well as both offline and online). They are currently the users who receive the most benefit from our offering

Unfortunately, however, a fully working online/offline system is pretty difficult to achieve and validate. Any such system must involve viewing minitocos as physical items, like books that you can check out from the library, or like cash that, once withdrawn, does not count against your balance, but is in your possession. Such a system, I believe, is beyond the scope of this project.

### Email verification is unnecessary.

When signing up for a web service, users should be forced to verify their identity in some way. Most systems use some sort of email/phone text verification system through a service like SendGrid or Twilio. While I will be implementing a system wherein users can log in, I will not implement the user verification system in order to limit scope.


## Approach

### Data Objects

Valuing consistency over verbosity, all data objects will:
1. Have private constructors
2. Be constructable via named static function
3. Use builder pattern to be constructed

With Github Copilot, the overhead in doing this is not hard, and copilot is often capable of figuring out the code you want to write. This greatly reduces the effort behind the approach above. In addition to the consistency and code generation benefits, the class itself operates as its own static factory.

Finally, all properties will be readonly. Fluent interfaces like this are very prescriptive on how objects are created, which should make object creation very readable, if more verbose. I realize that this choice could be controversial, however, better this than complete lack of consistency or approach.

### I/O Objects are not Database Objects

I/O objects are intended to serve as view models for the views provided by the client application. However, there is no reason why the views of the application should be tied to the database schema. In fact, it is healthy to separate the I/O models from the database models (even though Prisma has a great generator of the database models). This approach better facilitates server-client communications and enables the client to change without affecting the backing data schema.

### Separation of implementation from interface

