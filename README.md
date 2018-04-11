# Prerequisites
You will need the Qtum client for the OS you are testing on (or building against).

Download the [Qtum client](https://github.com/qtumproject/qtum/releases) for the correct OS and put the `bin/` folder in the corresponding dir:

```
bodhi-graphql         qtum release files (example)

qtum/mac/bin          qtum-0.14.16-osx64.tar.gz 
qtum/win64/bin        qtum-0.14.16-win64.zip
qtum/win32/bin        qtum-0.14.16-win32.zip
qtum/linux64/bin      qtum-0.14.16-x86_64-linux-gnu.tar.gz
qtum/linux32/bin      qtum-0.14.16-i686-pc-linux-gnu.tar.gz
```

# Updating UI Files
1. In UI repo, `npm run build` to build the UI files

2. Copy all the files in `bodhi-ui/build` folder to `bodhi-graphql/ui`

# Run Dev Environment
1. `git clone https://github.com/bodhiproject/bodhi-graphql.git`

2. `cd bodhi-graphql`

3. `npm run install-dep`

4. To start services either:

    	npm start // starts API, sync
    	npm run start-elec // start API, sync, launch UI (static built files in ui/ folder)

5. App at `127.0.0.1:5555` or GraphiQL at `127.0.0.1:5555/graphiql`

# Release
We are currently using [Electron](https://github.com/electron/electron) and [Electron-Builder](https://github.com/electron-userland/electron-builder) to package our apps into native format depending on OS.

1. `npm run install-dep` to install all node modules from npm and yarn

2. Run the build script for the appropriate OS:

    	npm run build:mac // creates dmg
    	npm run build:win // creates exe
    	npm run build:lin // creates appimage

3. Run the executable
