require('dotenv').config()

const refreshTwitchToken = async (refreshToken) => {
  const data = await axios
    .post(
      `https://id.twitch.tv/oauth2/token
    --data-urlencode
    ?grant_type=refresh_token
    &refresh_token=${refreshToken}
    &client_id=${process.env.TWITCH_CLIENT_ID}
    &client_secret=${process.env.TWITCH_SECRET}`
    )
    .then((res) => console.log(res))
    .catch((err) => {
      console.log(err)
    })
  return data
}

module.exports = refreshTwitchToken