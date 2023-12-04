const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const app = express()
const dbpath = path.join(__dirname, 'userData.db')
app.use(express.json())

let db = null
const initailizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running')
    })
  } catch (error) {
    console.log(`DB Error : ${error.message}`)
    process.exit(1)
  }
}
initailizeDbAndServer()

const validPassword = password => {
  return password.length > 4
}

app.post('/register', async (request, response) => {
  const {username, password, name, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectQuery)
  if (dbUser === undefined) {
    const getQuery = `INSERT INTO user (username,name,gender,password,location) VALUES ('${username}', '${hashedPassword}','${name}','${location}','${gender}' )`
    if (validPassword(password)) {
      await db.run(getQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const comparePassword = await bcrypt.compare(password, dbUser.password)
    if (comparePassword === ture) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const createQuery = `SELECT * FROM user WHERE username = '${username}' `
  const dbUser = await db.get(createQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (isPassword === true) {
      if (validPassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const update = `UPDATE user SET password = '${hashedPassword}' WHERE username = ${username} `
        const user = await db.run(update)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
