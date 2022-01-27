const removeDbFacebookValues = require('../utils/removeDbFacebookValues')
const updateDbFacebookValues = require('../utils/updateDbFacebookValues')

const express = require('express'),
  router = express.Router(),
  pool = require('../db'),
  { default: axios } = require('axios')
require('dotenv').config()

router.post('/api/authorize/facebook', async (req, res) => {
  // fB docs: https://developers.facebook.com/docs/pages/access-tokens/
  const { userId, facebookAccessToken, facebookUserId } = req.body

  const result = await axios.get(
    `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${facebookAccessToken}`
  )

  console.log('get long FB access token ' + result.data.access_token)
  const longFacebookAccessToken = result.data.access_token

  updateDbFacebookValues(
    userId,
    facebookAccessToken,
    longFacebookAccessToken,
    facebookUserId
  )
  return res
    .status(200)
    .send({ longFacebookAccessToken: longFacebookAccessToken })
})

router.post('/api/authorize/facebook/remove', async (req, res) => {
  // fB docs: https://developers.facebook.com/docs/pages/access-tokens/
  const { userId } = req.body

  console.log('remove facebook access token')

  removeDbFacebookValues(userId, null, null)
  return res
    .status(200)
    .send({ msg: 'facebook token and long access token removed' })
})

module.exports = router
