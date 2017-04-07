---
layout: post
published: false
comments: true
title: The trick to learning to code
categories:
  - Programming
tags: 'programming, coding, learning to code, learn to code'
description: ''
modified: ''
---
We live in a great time where learning to code is now easier than ever, with many free resources available teaching a wide variety of languages. Sites like http://codecademy.com have gained lots of popularity and are a great starting point for beginners to pick up the basics.

However I've been asked the same question over and over and have seen it repeated around the internet. _"I've completed all the exercises in the course for XYZ language, but now what should I do?"_ In my opinion, the answer to simply start building something. I think that courses and books will only get you so far when it comes to learning to code. Theres no substitute for actually building something.

### What to build?

This can also be daunting to some people, it can be hard to come up with something to build as well as trying to figure out just where to start. Personally, I find building a game is one of the best first projects to do. Having something that you can interact with and directly see the fruits of your labour provides a sense of motivation and a more tangible reward for the work you put in. Simpler games like snake, hangman, tic-tac-toe are some examples of what you could start with. One of the first projects I built was a hangman game that was played in the terminal. It even had a basic AI that would try to guess your word, I remember the sense of amazement and joy when my AI first guessed my word in just a few goes. All the AI did was filter down a list of words from a dictionary file, however it felt like a whole lot more because it was something I could actually see the results of. A simple algorithm felt like magic and motivated me to continue on and see what else I could build.

Of course your choice of language can limit what types of games you can build, eg javascript allows a lot more possibilities as you have the browser to run it in. Even if you don't want to go the route of building a game, thinking up a project where you can really see the results of your labour is the key part. Any utilities that would help automate something your normally do by hand are perfect projects to work on. 

What it comes down to is that writing snippets of code that solve basic problems like Fizzbuzz are good for learning syntax and the basics of programming. But they don't teach you how to apply coding to real world problems. Starting a project that provides a more tangible output is what you should be moving on to. 

### How to build it?

A note before you actually start building, having the cleanest code isn't too important when your beginning. A working piece of code is much more important. However I do recommend taking a few minutes to have a look at some style guides for your chosen language. Bad habits are hard to break and its a good idea to make sure you're applying commonly used practises from the get go.

One of the hardest things about coding your project might just actually be starting it. It's very easy to get overwhelemed with details and lose sight of where to begin. The first thing I recommend doing is simply set up the bare bones structure for your project. For languages like Java, this would be starting a new project in your IDE of choice. In Ruby it would just be creating a new folder with a Gemfile ( if you plan on using 3rd party gems ).

The next part is what I consider to be the most important, brainstorming and planning how you think will implement your project. As a beginner you might not have a clear idea of how its all going to work but thats ok. Instead try to break down your project to its individual pieces and think of questions about how to fit it all together. For example if you were building the game 'Snake' the parts might be:

- The background game space
- The Snake
- Apples
- Maybe some obstacles
- A scoreboard

And then the questions about how they fit together might be:

- How will I present the game? ( Browser, terminal, GUI etc )
- How will the snake move?
- What happens if the snake runs into an apple?
- What happens if the snake runs into a wall?
- What conditions would cause the game to be over?

Jut down anything you can think of, its best to get it out of your head and onto paper. It might be hard to try and think of implementation details like how things will be represented / expressed in code. Thats ok, I recommend starting off one piece at a time and going back and changing things if they don't quite work together. As you become more comfortable with programming, you can move implementation details to your initial plans. As they say; __"Hours of programming can save minutes of planning"__ and so the more you can try and plan for, the better.

I'm not going to do a walkthrough of how to build snake but I will list some basic implementation steps you might take. 

- First having a game space drawn to the screen.
- Then showing a snake in the space.
- Allow the snake to be controlled by the user and move around the space.
- Have an apple show up on screen.
- Make the snake larger when it consumes an apple, spawn in a new apple.
- Increase the score when an apple is eaten.
- Add in handling for any game over scenarios. Eg: When the snake runs into a wall.
- Handle when a game is over, add in restart functionality.


The key thing to remember is that you've broken things down to smaller problems and to try solve those as you go. Don't be afraid to use Google and resources like StackOverflow. As you run into problems try spending 15 - 20 minutes solving them. If you can't, fall back to using Google. However resources like documentation should be consulted whenever you need them. You might have to end up googling a lot of things, but thats ok. Much of programming is actually just googling, just be sure to actually write code out yourself and not just rely on copy pasting. Understand whats coming into your project.

Whilst much of programming does rely on using 3rd party libraries, I'd recommend staying away from most of them in your first few projects. When you're learning they can tend to abstract away much of the code from you and its too easy to not understand whats actually going on under the hood. 
