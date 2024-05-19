# IMDb Movie & TV Search Engine WebApp

This project is a web application that allows users to search for movies and TV shows using the OMDb API. The 
application is built using Node.js, Express.js, Axios, and EJS. It provides a user-friendly interface for searching and 
browsing movies and TV shows, along with a feature to watch the videos directly in the app.

## Project Structure

The project's structure is as follows:

- `app.js`: The main entry point of the application, which sets up the server and listens for incoming requests.
- `.env` file: This file contains environment variables that are used by the application, such as the OMDB API key.
- `/public` directory: This directory contains static assets such as CSS and images that are served directly to the 
  client.
- `/views` directory: This directory contains EJS templates for rendering web pages. 
  The `index.ejs` file is the main template for the application, which displays the search results and other content.

## Installation and Setup

To install and set up the project, follow these steps:

1. Clone the repository to your local machine.
2. Navigate to the project directory in your terminal.
3. Install the required dependencies by running `yarn install`.
4. Create a `.env` file in the project root directory and add the following lines:
   - [ ] `OMDB_API_KEY=your_api_key_here` - replace `your_api_key_here` with your actual OMDB API key.
   - [ ] `PORT=1234` - replace `1234` with the port you want the node server to run on. 
         _The server will listen on port 3000 by default without this setting._
5. Start the application by running `yarn start`.

## Features

The application provides the following features:

1. Search for movies and TV shows using the OMDb API. 
2. Display search results on the screen. 
3. Watch videos directly on the webpage using the VidSrc video API. 
4. Display movie and TV show posters on the screen.

## Known Issues

- [ ] The application currently does not handle errors gracefully. If an error occurs during the search request or 
      while rendering the webpage, it may cause the application to crash.
- [ ] The application does not have a proper authentication mechanism. Anyone with access to the application can 
      perform searches and watch videos.
- [ ] The application does not have a proper logging mechanism. If an error occurs during the search request or while 
      rendering the webpage, it may not be logged or displayed to the user.
- [ ] There are some layout issues on mobile and tablet that need resolving.

## Future Enhancements

- [ ] Change layout to include all episodes on the view screen.
- [ ] Implement a proper authentication mechanism to restrict access to the application.
- [ ] Add more features such as: 
  - [ ] User profiles 
  - [ ] Personalised recommendations
  - [ ] Better search interface
  - [ ] Bookmarks to save items to profile
- [ ] Implement a proper logging mechanism to track errors and user interactions.
- [ ] Improve the error handling mechanism to provide better feedback to the user when an error occurs.

## License

> Copyright (c) 2024 [Justin Hartman](https://justhart.com). All rights reserved.   
> The application is licensed under the [MIT license](LICENSE.md).
