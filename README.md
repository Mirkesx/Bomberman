# Bomberman

Assignment for the Web Programming course of the University of Catania. This is a repo about a Bomberman-like multiplayer videogame as a Node.js application. 

Do you believe that nowadays games are overrated? Do you still play with your Super Nintendo because PS5 is just for spoiled children? Then you will surely like this project! You probably should know about Bomberman (if not, shame on you, google it... now). The gameplay is pretty straight-forward: 2 to 4 players fighting each others using bombs. You can get power-ups to become stronger. The last man standing wins (doesn't it sounds so much like battle royales?).

This software allows you to start a web-server application. It will allow you to create private rooms to play with friends, you can even pick an avatar and chat through the main page of the game. The first who enters an empty room will be the host and can setup the game (choosing the number of bombs and such) and then start the game when all the players are ready.

That's awesome, right? But... how to use this?

# Usage
<lr>
  
You can choose 2 ways to start/host this game:
- npm
- docker

<h3>Start the server with npm</h3>
<lr>
  
<strong>Requires</strong> npm to be installed on your pc!

Clone this repo on your pc. Open a terminal and go to the root of the repo then type "npm install".

When all the modules are installed, just type "npm start". It will run a web-server in your localhost listening on the port <strong>8080</strong>. You can change this port if you want editing the file <strong>main.js</strong>.

Once you run the server you have 3 ways to connect:
- Open a web browser on the pc running the server and go to "localhost:8080" web-page
- Open a web browser on another pc/mobile and go to "<local-address-ip>:8080" web-page (you can get the local address ip by typing ip addr/ipconfig commands on your terminal)
- Set a port-forwarding rule on your router on the port 8080, and connect through internet at "<public-address-ip>:8080". This would be the solution you would need if you'd like to play with a friend. You can get your public address googling it
  
For the third solution: once you stop using this server i suggest you to destroy the rule.
  
That's all!


<h3>Start the server with docker</h3>
<lr>
  
<strong>Requires</strong> docker to be installed on your pc! It is easier to get it on Linux/Mac OS, but you can get it on windows with WSL 2.

Open a terminal and type "docker pull mirkesx/bomberman". Then type "docker run -p 8080 mirkesx/bomberman". This will run the webserver.

Now open a new terminal and type "docker ps". This command will show you all the running containers on your system. Find the container running the image "mirkesx/bomberman" and check the port column. You will find something like <#port> -> 8080. The <#port> is the one you need to connect to the game. 

Once you get the port you have 3 ways to connect:
- Open a web browser on the pc running the server and go to "localhost:<#port>" web-page
- Open a web browser on another pc/mobile and go to "<local-address-ip>:<#port>" web-page (you can get the local address ip by typing ip addr/ipconfig commands on your terminal)
- Set a port-forwarding rule on your router on the port <#port>, and connect through internet at "<public-address-ip>:<#port>". This would be the solution you would need if you'd like to play with a friend. You can get your public address googling it

For the third solution: once you stop using this server i suggest you to destroy the rule, especially since docker changes the port every time (basically it will be probably useless once you run again the docker image).

That's all!

# References
<lr>
 - WSL 2 https://docs.microsoft.com/it-it/windows/wsl/wsl2-index
