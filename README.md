
#Dependencies
`sudo apt-get install libxss1`

#1 Go to `database/index.js` file and place the database credentials.

#2
`nvm use`

#3
`npm install`

#Starting the crawler
 - Without logging: `node index.js`
 - With logging: `node index.js |& tee -a [filename.txt] `


### Category URLs List

Open the `CategoryList/category-list.js` file, edit the `categoryList` array as you wish.

> BE SURE THAT THE URL YOU PROVIDED SHOULDN'T REDIRECT TO ANOTHER URL. OTHERWISE THE SCRIPT WILL STUCK AT CRAWLING AND WILL POPULATE DUPLICATE RECORDS UNDER `service-urls` document.

### DB Structure

All the settings are defined under `database/` folder.
