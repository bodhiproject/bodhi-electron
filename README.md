# Prerequisites
You will need the Qtum client for the OS you are testing on (or building against).

Download the [Qtum client](https://github.com/qtumproject/qtum/releases) for the correct OS and put the `bin/` folder in the corresponding dir:

    qtum/mac/bin
    qtum/mac/win64
    qtum/mac/win32
    qtum/mac/linux64
    qtum/mac/linux32

# Run Dev Environment
1. `git clone https://github.com/bodhiproject/bodhi-graphql.git`

2. `cd bodhi-graphql`

3. `npm install`

4. `npm start`

5. App at `127.0.0.1:5555` or GraphiQL at `127.0.0.1:5555/graphiql`

# Package For Release 
We are currently using [Electron](https://github.com/electron/electron) and [Electron-Builder](https://github.com/electron-userland/electron-builder) to package our apps into native format depending on OS.

1. `npm install` to install node modules

2. `npm run yarn` to install yarn modules

3. Run the build script for the appropriate OS:

    npm run build:mac
    npm run build:win64
    npm run build:win32
    npm run build:linux64
    npm run build:linux32

    This will create the `app` directory that you will copy for the Electron prebuilt binary.

4. Follow the `Application Distribution` instructions on Electron website:

    - [Application Distribution](https://electronjs.org/docs/tutorial/application-distribution)
    - [Prebuilt Binaries](https://github.com/electron/electron/releases)

5. Once you have the prebuilt binary unzipped, you can copy the `app` directory to the appropriate place depending on the OS.

6. Run the Electron executable
