const express = require('express'),
  router = express.Router(),
  updateDbYoutubeValues = require('../utils/updateDbYoutubeValues'),
  updateYoutubeAccessToken = require('../utils/updateYoutubeAccessToken'),
  pool = require('../db'),
  { default: axios } = require('axios')
require('dotenv').config()

router.post('/api/authorize/youtube', async (req, res) => {
  // google docs: https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps

  // auth w curl: https://www.ionos.com/digitalguide/server/tools/introduction-to-curl-in-linux/

  const { userId, code } = req.body

  const youtubeRedirectUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.YOUTUBE_REDIRECT_URL_PROD
      : process.env.YOUTUBE_REDIRECT_URL_DEV

  var dataString = `code=${code}&client_id=${process.env.YOUTUBE_CLIENT_ID}&client_secret=${process.env.YOUTUBE_CLIENT_SECRET}&redirect_uri=${youtubeRedirectUrl}&grant_type=authorization_code`

  const youtubeData = await axios.post(
    'https://accounts.google.com/o/oauth2/token',
    dataString
  )

  console.log(youtubeData.data)

  const { access_token, refresh_token } = youtubeData.data
  await updateDbYoutubeValues(userId, access_token, refresh_token)

  return res.status(200).send(youtubeData.data)
})

router.post('/api/authorize/youtube/refresh', async (req, res) => {
  const { userId, refreshToken } = req.body

  // switch this out homie
  var dataString = `client_id=${process.env.YOUTUBE_CLIENT_ID}&client_secret=${process.env.YOUTUBE_CLIENT_SECRET}&refresh_token=${refreshToken}&grant_type=refresh_token`

  const youtubeData = await axios.post(
    'https://accounts.google.com/o/oauth2/token',
    dataString
  )

  console.log(youtubeData.data)

  const { access_token } = youtubeData.data
  updateYoutubeAccessToken(userId, access_token)

  return res.status(200).send(youtubeData.data)
})

module.exports = router
