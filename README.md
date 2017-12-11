# a2vhsite
[![npm version](https://img.shields.io/npm/v/a2vhsite.svg)](https://www.npmjs.com/package/a2vhsite)
[![Travis](https://img.shields.io/travis/danielhickman/a2vhsite.svg)](https://travis-ci.org/danielhickman/a2vhsite)
[![dependencies: vorpal | mkdirp | chalk](https://img.shields.io/badge/dependencies-vorpal%20%7C%20mkdirp%20%7C%20chalk-lightgrey.svg)](https://github.com/danielhickman/a2vhsite/network/dependencies)
[![license](https://img.shields.io/github/license/danielhickman/a2vhsite.svg)]()

## Description
An interactive CLI for creating Apache2's virtual host files.

Decrease frustration with server management, use an interactive walkthrough of common directives; a template for advanced configurations; or command line arguments to control your Apache2 VirtualHost .conf files! Learn more about the individual directives [here](https://httpd.apache.org/docs/current/vhosts/) and [here](https://httpd.apache.org/docs/2.4/mod/core.html).

## Prerequisites
- [Node.js](https://nodejs.org/en/download/) - recent version required for some ES6 features
- Apache2 - if reloading and enabling


## Installation
###### From npm
```bash
$ npm install a2vhsite -g
```
###### From source
```bash
$ git clone https://github.com/danielhickman/a2vhsite
$ cd a2vhsite/
$ npm install -g
```


---


## Usage
1. Install a2vhsite, preferably globally
2. Run `a2vhsite create help` to see all the available options
3. Run the program either from the command line or enter its interface by not adding any arguments

### Examples
```bash
# Use from the command line interactively
$ a2vhsite create example.com example.org
```
```bash
# Make instances of a template
$ a2vhsite create --template ./template.conf --output ./ example.com example.org
```
```bash
# Use as an interactive command line interface
$ a2vhsite
a2vhsite: create

"Welcome to interactive mode! This will walk you through some common settings.
If you find this isn't advanced enough for you, try template mode! Some helpful
information for you: false indicates the directive won't be set, the parentheses
include helpful defaults you can use by not entering anything, and you can use
{domain} to have your domain replace automatically."

Domains to use (separated by spaces): example.com example.org
[...]
```


## License
Copyright Daniel Hickman, [MIT License](https://github.com/danielhickman/a2vhsite/blob/master/LICENSE)
