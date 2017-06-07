# fontello-svg-uploader
It is a script to help developers to batch upload svgs to fontello.com

# Purpose of this script
This script is used under two conditions:
First, the script helps you to upload all the svgs to http://fontello.com via API when you initiate a new project.
Second, the script helps you to add new svgs to the existing font collection.

# How to use this script
Create a folder called 'svgs' where you can place all your svgs and run 'node script.js' in the terminal. Then you will get a zip file downloaded for you. Please remember to remove all the svgs in the './svgs' folder after you check everything is fine as well as the zip file.

A file called 'config.json' would be generated to keep track of your font info. Next time if you want to update your font collection, just drop the new svg files to the './svgs' and run 'node script.js' again. Don't remove the config.json file.

# Dependencies
This script is based on node.js. Make sure you have installed node.js and NPM. 
