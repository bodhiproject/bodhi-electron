# Installation
1. `git clone https://github.com/bodhiproject/bodhi-graphql.git`

2. Run `npm run install-dep` to update all submodules and install all dependencies needed.

# Run Dev Environment
  
    npm start

# Build Release Versions
We are currently using [Electron](https://github.com/electron/electron) and [Electron-Builder](https://github.com/electron-userland/electron-builder) to package our apps into native format depending on OS.

1. `npm run install-dep` to update all submodules and install all dependencies needed.

2. Run the build script for the appropriate OS:

        // Mainnet/Testnet build
        npm run build:mac // creates dmg
        npm run build:win // creates exe
        npm run build:lin // creates appimage

        // Testnet only build
        npm run build:mac-tn // creates dmg
        npm run build:win-tn // creates exe
        npm run build:lin-tn // creates appimage

3. Run the executable

# Updating UI Files
1. In UI repo, `npm run build` to build the UI files

2. Copy all the files in `bodhi-ui/build` folder to `bodhi-graphql/ui`
