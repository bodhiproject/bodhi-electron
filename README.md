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

# Release
We are currently using [Electron](https://github.com/electron/electron) and [Electron-Builder](https://github.com/electron-userland/electron-builder) to package our apps into native format depending on OS.

1. `npm run insall` to install all node modules from npm and yarn

2. Run the build script for the appropriate OS:

    npm run build:mac // creates dmg
    npm run build:win // creates exe
    npm run build:lin // creates appimage

3. Run the Electron executable
