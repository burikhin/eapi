# Eapi
REST API на node.js и mongodb

# Prerequisite
Install mongodb and node.js

# Install
* npm install - install node modules
* npm install.js - insert data to the db
* npm app.js - run server on http://localhost:3000

# API
* GET /user/:id - посмотреть данные пользователя
* POST /friends/:id/invite/:friend - добавить в друзья
* POST /friends/:id/confirm/:friend - подвердить запрос в друзья
* POST /friends/:id/decline/ - отклонить запрос в друзья
* GET /user/:id/invites - список запросов в друзья
* GET /friends/:id - список друзей
* GET /friends/:id/depth/:depth - список друзей друзей
