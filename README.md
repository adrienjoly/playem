playem
======

a social tv project

[![Analytics](https://ga-beacon.appspot.com/UA-1858235-12/playem/github)](https://github.com/igrigorik/ga-beacon)

###How to develop and contribute your own UI

####prerequisites

1. create a github account
2. install `git` (command line tool)
3. set it up so that it's linked to your github account

####setup

1. [fork playem](https://github.com/adrienjoly/playem/fork/)

2. from a terminal, download the source code of that fork to a directory of your computer:

    `git clone https://github.com/<YOUR GITHUB USERNAME>/playem.git`

3. go to the "playem" directory, then run the HTTP server locally:

    `./run_local`

4. open this page in your web browser: http://localhost:8000

5. back in the terminal, press Ctrl-C to stop the server

6. create your own development branch

    `git branch mybranch`
    
7. duplicate ui-default to your own ui-XXX directory

####development iterations

1. restart the server: `./run_local`

2. open `http://localhost:8000/#design=XXX` (this loads style.css and ui.js from your own ui- directory)

3. make any change you want in your own ui- directory (.css, .js, images...)

4. refresh the page in your web browser in order to test your changes, then iterate again from step 1

####commiting and pushing an interation

1. check which files were updated locally

  `git status`

2. select the updated files that you want to commit, example:

  `git add ui-XXX/*`

3. commit these updated files with a concise description, exemple:

  `git commit -m "changed the background image"`

4. upload those changes back to your github project

  `git push`

5. then you can "pull request" from your project's page on github, if you want your changes to be pushed to playem.org
