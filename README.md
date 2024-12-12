## Meeting Hub Backend for Rendering Websites and Interacting with them

## Table of Contents

- Quick start
  - [Prequesites](#prequesites)
  - [Install](#install)
  - [Usage](#usage)

## Prequesites

- You need the latest Node 20 LTS version installed [Node.js](http://nodejs.org)
- You need the Ubii Master Node running
- certificate

## Install

First install all dependencies:

```bash
$ npm install
```

## Usage

After you've installed the dependencies you can run the application:

```bash
$ npm run start
```

### Components ###
To use the Website Renderer just create a new WebsiteRenderer instance, passing the ubiiNode in the constructor and call init(url) on it. The url parameter is the url of the website you want to render.
```code
const websiteRenderer = new WebsiteRenderer(ubiiNode);
websiteRenderer.init("https://excalidraw.com/");
```