# IMDb Movie & TV Search Engine WebApp

This project is a web application that allows users to search for movies and TV shows using the OMDb API. The 
application is built using Node.js, Express.js, Axios and MongoDB. It provides a user-friendly interface for searching  
and browsing movies and TV shows, along with a feature to watch the videos directly in the app.

## Features

The application provides the following features:

1. Search for movies and TV shows using the OMDb API. 
2. Display search results on the screen. 
3. Watch videos directly on the webpage using the VidSrc video API. 
4. Display movie and TV show posters on the screen.
5. Comments under each movie/series via Disqus.
6. User registration, login, logout, profile and watchlist functionality via a MongoDB database.
7. Configuration files to set up Nginx and systemd for running as a webapp under a domain name.
8. Documentation to help you get setup with MongoDB and other items for making the app work.
9. A RapidAPI file for macOS and Visual Studio with all the OMDb API endpoints for you to test with.

## Core Project Structure

The core project's structure is as follows:

- `app.js`: The main entry point of the application, which sets up the server and listens for incoming requests.
- `.env.example` file: Example file containing environment variables used by the application (see instructions below).
- `/config` directory: Contains all the application config files.
- `/helpers` directory: Contains helper files for reusable components.
- `/public` directory: Contains static assets that are served directly to the client browser.
- `/routes` directory: Contains various app route files.
- `/views` directory: Contains EJS templates for rendering web pages.

## Authentication & User Project Structure

By default, the app will work out the box, however, it is also capable of handling user registration,
login, logout, profile and watchlist functionality through the use of a MongoDB database.
I figured that MongoDB may be beyond some people's scope, so I wanted to keep the app lightweight and easy to get 
running without complex configuration, therefore enabling MongoDB is optional.

The authentication and user project structure is as follows:

- `migrate-mongo-config.js`: The configuration file for running MongoDB migrations
- `/controllers` directory: Contains auth and watchlist application controller login. 
- `/middleware` directory: Contains the application auth middleware.
- `/migrations` directory: Contains migrations to setup and alter the MongoDB.
- `/models` directory: Contains the User model and any future models. 

## Installation and Setup

You can decide to run the app in its basic format where it will just act as a search engine and video player.
However, you can also enable the Authentication & User format which uses MongoDB to save items to user's profiles.

### Basic Application

To install and set up the basic project, follow these steps:

1. Clone the repository to your local machine.
2. Navigate to the project directory in your terminal.
3. Install the required dependencies by running `yarn install`.
4. Rename `.env.example` to simply `.env` in the project root directory and change the following lines:
   - [ ] `OMDB_API_KEY=your_api_key_here` - replace `your_api_key_here` with your actual OMDB API key.
   - [ ] `API_PORT=3000` - replace `3000` with the port you want the node server to run on. 
   - [ ] `APP_URL=binger.uk` - replace `binger.uk` with your website/app's live URL.
5. Start the application by running `yarn start`.

### Nginx and Systemd Server Setup

Included in the `/system` folder are two configuration files:

1. `/system/nginx/binger.uk.conf`: this is an Nginx config file for running the app using Nginx
2. `/system/systemd/binger.service`: this is an Ubuntu/Debian systemd config file for booting up the Node.js server

Modify these to suite your environment to get the app running.

**Note:** the empty folder `/system/nginx-root/` is used in the `/system/nginx/binger.uk.conf` nginx file for SSL.
If you would like to use SSL we recommend installing `certbot` and then executing this command:

```bash
# replace binger.uk with your domain name
$ sudo certbot --nginx -d binger.uk
```

### Advanced Application (optional)

To get the authentication and user functionality working, make sure you've followed all the steps above in the Basic 
Application and then follow these steps.

1. Install and configure MongoDB. There are detailed instructions here:
   - [Install for Debian Bookworm](./docs/mongodb/INSTALL_DEBIAN.md) found at `./docs/mongodb/INSTALL_DEBIAN.md`
   - [Install for Ubuntu 20.04](./docs/mongodb/INSTALL_UBUNTU.md) found at `./docs/mongodb/INSTALL_UBUNTU.md` - note 
     that these instructions come from ChatGPT and I haven't tested them.
     I have a Debian server so please correct the instructions if you find any are incorrect and submit a PR.

2. Uncomment the following in your `.env` file:
   ```dotenv
    #MONGO_URI="mongodb://localhost:27017"
    #MONGO_DATABASE=binger-uk
    #MONGO_USERNAME=
    #MONGO_PASSWORD=
    #MONGO_HOST=localhost
    #MONGO_PORT=27017
   ```
   With them uncommented your `.env` file should look like this (assuming you followed the supplied tutorial in step 1): 
    ```dotenv
    MONGO_URI="mongodb://localhost:27017"
    MONGO_DATABASE=binger-uk
    MONGO_USERNAME=myAdminUser
    MONGO_PASSWORD=myAdminPassword
    MONGO_HOST=localhost
    MONGO_PORT=27017
   ```
   At a minimum, you must have added in values for `MONGO_URI` and `MONGO_DATABASE`.
   You only need to add username and password if you secured your MongoDB installation as per my Step 1 documentation.   

3. You need to run the MongoDB migrations once you've added your MongoDB details to your `.env` file. 
   Open up a terminal and in the project root run the following:
   ```bash
   yarn db:migrate
   ```
   Or if you are using NPM:
   ```bash
   npm run db:migrate
   ```

4. With the MongoDB collection now migrated, you can begin using your app. Simply restart your node server so your 
   latest configs are loaded. If you've used the [systemd service file](./system/systemd/binger.service) I've supplied 
   at `./system/systemd/binger.service` then all you need to do is restart the service with:
   ```bash
   sudo systemctl restart binger.service
   ```

5. You can now test your app URL paths like `./user/register`, `./user/login` and `./user/profile` paths to see if data 
   is being stored correctly.

## OMDb API

Included in this repository is a [RapidAPI](https://rapidapi.com) file created by the macOS app RapidAPI which is free.
There is also a VSCode extension which should be able to work with this file but YMMV.

The file is located at [/docs/api/OMDb_API.paw](/docs/api/OMDb_API.paw) and contains a working implementation of the 
OMDb API used in this project. Open the file and begin testing the API to see responses.

## Known Issues

- [ ] The application currently does not handle errors gracefully. If an error occurs during the search request or 
      while rendering the webpage, it may cause the application to crash.
- [x] ~~The application does not have a proper authentication mechanism. Anyone with access to the application can 
      perform searches and watch videos.~~
- [ ] The application does not have a proper logging mechanism. If an error occurs during the search request or while 
      rendering the webpage, it may not be logged or displayed to the user.
- [x] ~~There are some layout issues on mobile and tablet that need resolving.~~

## Future Enhancements

- [x] ~~Improve UI on View player page to include movie/tv information and title.~~
- [ ] Change layout to include all episodes on the view screen.
- [x] ~~Implement a proper authentication mechanism to restrict access to the application.~~
- [ ] Add more features such as: 
  - [x] ~~User profiles~~ 
  - [ ] Personalised recommendations
  - [x] ~~Better search interface~~
  - [x] ~~Bookmarks to save items to profile~~
- [ ] Implement a proper logging mechanism to track errors and user interactions.
- [ ] Improve the error handling mechanism to provide better feedback to the user when an error occurs.

## License

> Copyright (c) 2024 [Justin Hartman](https://justhart.com). All rights reserved.   
> The application is licensed under the [MIT license](LICENSE.md).
