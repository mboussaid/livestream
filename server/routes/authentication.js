const express = require('express'),
  router = express.Router(),
  pool = require('../db'),
  sendAuthCode = require('../utils/sendAuthCode'),
  validateEmail = require('../utils/validateEmail')

router.post('/api/user/register', async (req, res) => {
  const { email } = req.body
  const code = Math.floor(100000 + Math.random() * 900000)
  const timeCreated = new Date().toUTCString()

  if (!email) {
    return res.send({ error: 'Please do not leave email empty' })
  }
  if (validateEmail(email) == false) {
    return res.send({ error: 'Please add a valid email address' })
  } else {
    const user = await pool.query(`SELECT * FROM users WHERE user_email = $1`, [
      email,
    ])
    // CHECKS IF USER EMAIL ALREADY EXISTS
    if (user.rows.length != 0) {
      return res.send({ error: 'An account with that email already exists' })
    } else {
      let newUser = await pool.query(
        'INSERT INTO users (user_email, user_code, user_date_created) VALUES ($1, $2, $3) RETURNING *',
        [email, code, timeCreated]
      )
      sendAuthCode(email, code)

      return res.json(newUser.rows[0])
    }
  }
})

router.post('/api/user/login', async (req, res) => {
  const { email } = req.body
  const code = Math.floor(100000 + Math.random() * 900000)

  try {
    const user = await pool.query(`SELECT * FROM users WHERE user_email = $1`, [
      email,
    ])
    if (!email) {
      return res.send({ error: 'Please do not leave email empty' })
    }
    if (validateEmail(email) == false) {
      return res.send({ error: 'Please add a valid email address' })
    }
    if (user.rows.length === 0) {
      return res.send({ error: 'No email is associated with that account' })
    } else {
      await pool.query(
        `UPDATE users SET user_code = $1 WHERE user_email = $2`,
        [code, email]
      )
      console.log(user.rows[0])
      sendAuthCode(email, code)
      return res.json(user.rows[0])
    }
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server error occurred while logging in')
  }
})

router.put('/api/user/destinations', async (req, res, next) => {
  const userId = req.body.userId

  const twitchBoolean = req.body.twitchAuthBool
  const youtubeBoolean = req.body.youtubeAuthBool
  const facebookBoolean = req.body.facebookAuthBool

  try {
    if (twitchBoolean) {
      await pool.query(`UPDATE users SET twitch_auth = $1 WHERE user_id = $2`, [
        twitchBoolean,
        userId,
      ])
      return res.status(200).send('Twitch authentication added')
    }
    if (facebookBoolean) {
      await pool.query(
        `UPDATE users SET facebook_auth = $1 WHERE user_id = $2`,
        [facebookBoolean, userId]
      )
      return res.status(200).send('Facebook authentication added')
    }
    if (youtubeBoolean) {
      await pool.query(
        `UPDATE users SET youtube_auth = $1 WHERE user_id = $2`,
        [youtubeBoolean, userId]
      )
      return res.status(200).send('Youtube authentication added')
    }
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error occurred while updating user')
  }
})

router.post('/api/user/destinations', async (req, res, next) => {
  const userId = req.body.userId

  try {
    const user = await pool.query(
      `SELECT youtube_auth, twitch_auth, facebook_auth FROM users WHERE user_id = $1`,
      [userId]
    )
    res.json(user.rows[0])
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error occurred while updating user')
  }
})

router.post('/api/user/broadcast-access', async (req, res, next) => {
  const userId = req.body.userId

  try {
    const user = await pool.query(
      `SELECT youtube_auth, twitch_auth, facebook_auth, user_date_created, payment_tier FROM users WHERE user_id = $1`,
      [userId]
    )
    res.json(user.rows[0])
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error occurred while updating user')
  }
})

module.exports = router
