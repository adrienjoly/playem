playem
======

a social tv project

[![Analytics](https://ga-beacon.appspot.com/UA-1858235-12/playem/github)](https://github.com/igrigorik/ga-beacon)


##FAQ

###Videos are not playing / videos are missing

Playem extracts the videos shared by your Facebook friends. Only Youtube videos are supported in the current version. So, please make sure that the videos you are missing in Playem are indeed hosted on Youtube.

If you're feeling adventurous, you can try the development version that supports more sources: https://adrienjoly.com/playem/#player=all

If you're willing to help me improve Playem (e.g. fixing bugs and adding missing videos), I developed a version that lists all the links that are returned by Facebook, so that you can identify which ones are supposed to be supported: https://adrienjoly.com/playem/#player=debug

In the latter case, here is how to proceed:

1. open that link,
2. click on the fb connect button,
3. wait for a few dozens of links to be listed on the right of the screen,
4. click on the "select text" button (top-right corner)
5. copy and paste this text into a new email,
6. please keep only the lines that you're sure should be supported by playem (because they're videos or audio tracks)
7. send that email to contact at playem dot org, so that I can do my best to support these links

###How does it work behind the scenes?

[This sequence diagram](https://drive.google.com/file/d/0B6p16in14iyYcGg3NVhDTVZxcXc/edit?usp=sharing) says it all.

###The UI/design sucks... Can I contribute?

Yes, you can! Here is how:

####Prerequisites

1. create a github account
2. install `git` (command line tool)
3. set it up so that it's linked to your github account

####Setup

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

####Development iterations

1. restart the server: `./run_local`

2. open `http://localhost:8000/#design=XXX` (this loads style.css and ui.js from your own ui- directory)

3. make any change you want in your own ui- directory (.css, .js, images...)

4. refresh the page in your web browser in order to test your changes, then iterate again from step 1

####Commiting and pushing an interation

1. check which files were updated locally

  `git status`

2. select the updated files that you want to commit, example:

  `git add ui-XXX/*`

3. commit these updated files with a concise description, exemple:

  `git commit -m "changed the background image"`

4. upload those changes back to your github project

  `git push`

5. then you can "pull request" from your project's page on github, if you want your changes to be pushed to adrienjoly.com/playem
