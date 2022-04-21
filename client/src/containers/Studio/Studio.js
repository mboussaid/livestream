import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import * as FaIcons from 'react-icons/fa'
import Navbar from '../../components/Navbar/Navbar'
import BroadcastButton from '../../components/Buttons/BroadcastButton'
import DestinationButton from '../../components/Buttons/DestinationButton'
import StudioButton from '../../components/Buttons/StudioButton'
import Timer from '../../components/Timer/Timer'
import ViewCounter from '../../components/ViewCounter/ViewCounter'
import formatTime from '../../utils/formatTime'
import getCookie from '../../utils/getCookie'
import accurateTimer from '../../utils/accurateTimer'
import useInterval from '../../utils/useInterval'
import API from '../../api/api'
import './Studio.css'
import { useParams, useHistory } from 'react-router-dom'
import {
  SCOPE,
  DISCOVERY,
  CAPTURE_OPTIONS_USER_FACING,
  CAPTURE_OPTIONS_RECORD_SCREEN,
} from '../../constants/constants'

/* global gapi */

function Studio() {
  const [youtubeUrl, setyoutubeUrl] = useState('')
  const [youtubeBroadcastId, setYoutubeBroadcastId] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [facebookLiveVideoId, setfacebookLiveVideoId] = useState('')
  const [facebookAccessToken, setfacebookAccessToken] = useState('')
  const [longFacebookAccessToken, setlongFacebookAccessToken] = useState('')
  const [facebookPermalinkUrl, setfacebookPermalinkUrl] = useState('')
  const [twitchStreamKey, settwitchStreamKey] = useState('')
  const [twitchUsername, settwitchUsername] = useState('')
  const [twitchAccessToken, settwitchAccessToken] = useState('')
  const [twitchViewCount, settwitchViewCount] = useState(0)
  const [youtubeViewCount, setyoutubeViewCount] = useState(0)
  const [facebookViewCount, setfacebookViewCount] = useState(0)
  const [twitchChatMsgs, setTwitchChatMsgs] = useState(['Welcome to the chat!'])
  const [customRtmpServer, setcustomRtmpServer] = useState('')
  const [customRtmpStreamKey, setcustomRtmpStreamKey] = useState('')

  const [isActive, setIsActive] = useState(false)
  const [userFacing, setuserFacing] = useState(true)
  const [streamFinished, setstreamFinished] = useState(false)
  const [muted, setmuted] = useState(false)
  const [cameraOn, setcameraOn] = useState(true)

  const [videoUrl, setvideoUrl] = useState('')
  const [chunks, setchunks] = useState([])

  const email = getCookie('userEmail')
  const videoRef = useRef()
  const mediaRecorder = useRef()
  const stream = useRef(null)
  let liveStream
  let tempStream = new MediaStream()
  let GoogleAuth

  const { id } = useParams()
  const socket = useRef()
  // const ws = useRef()
  const productionWsUrl = 'https://ohmystream.xyz'
  const developmentWsUrl = 'ws://localhost:3001'
  const streamUrlParams = `?twitchStreamKey=${twitchStreamKey}&twitchUsername=${twitchUsername}&youtubeUrl=${youtubeUrl}&facebookUrl=${encodeURIComponent(
    facebookUrl
  )}&customRTMP=${
    customRtmpServer
      ? encodeURIComponent(customRtmpServer + '/' + customRtmpStreamKey)
      : ''
  }`

  const history = useHistory()
  const [elapsedSeconds, setelapsedSeconds] = useState(0)
  // Use polling every 5 minutes
  const viewCountTimer = 1000 * 60 * 1
  // Use polling every 30 seconds
  // const twitchViewCountTimer = 1000 * 30
  let timer = useRef(null)
  let on = false

  useEffect(() => {
    let userId = getCookie('userId')

    API.get('/broadcasts', {
      params: {
        userId,
        studioId: id,
      },
    })
      .then((res) => {
        console.log(res)

        const {
          facebook_destination_url,
          facebook_live_video_id,
          youtube_broadcast_id,
          youtube_destination_url,
          twitch_stream_key,
          custom_rtmp_server,
          custom_rtmp_stream_key,
        } = res.data

        setFacebookUrl(facebook_destination_url)
        setfacebookLiveVideoId(facebook_live_video_id)
        setYoutubeBroadcastId(youtube_broadcast_id)
        setyoutubeUrl(youtube_destination_url)
        settwitchStreamKey(twitch_stream_key)
        setcustomRtmpServer(custom_rtmp_server)
        setcustomRtmpStreamKey(custom_rtmp_stream_key)
      })
      .catch((err) => console.log(err))

    API.post('/destinations', { userId }).then((res) => {
      console.log(res)
      const {
        facebook_access_token,
        facebook_long_access_token,
        twitch_access_token,
        twitch_user_name,
      } = res.data

      setfacebookAccessToken(facebook_access_token)
      setlongFacebookAccessToken(facebook_long_access_token)
      settwitchAccessToken(twitch_access_token)
      settwitchUsername(twitch_user_name)
    })
  }, [])

  useInterval(() => {
    // Your custom logic here
    if (isActive && twitchStreamKey) {
      twitchLiveViewCount()
    }
    if (isActive && facebookLiveVideoId) {
      facebookLiveViewCount()
    }
    if (isActive && youtubeBroadcastId) {
      youtubeLiveViewCount()
    }
  }, viewCountTimer)

  // get facebook permalink url

  // useEffect(() => {
  //   if (facebookLiveVideoId) {
  //     API.post('/facebook/broadcast/permalink', {
  //       facebookLiveVideoId,
  //       longFacebookAccessToken,
  //     }).then((res) => {
  //       console.log(res.data)
  //       setfacebookPermalinkUrl(res.data)
  //     })
  //   }
  // }, [facebookLiveVideoId, longFacebookAccessToken])

  // if (isActive && socket.current) {
  //   console.log('socket messages incoming')
  //   socket.current.on('twitch-msg', (msg) => {
  //     setTwitchChatMsgs([...twitchChatMsgs, msg])
  //     console.log(twitchChatMsgs)
  //   })
  // }

  useEffect(() => {
    handleClientLoad()
  }, [])

  function handleClientLoad() {
    // Load the API's client and auth2 modules.
    // Call the initClient function after the modules load.
    gapi.load('client:auth2', initClient)
  }

  function initClient() {
    // Initialize the gapi.client object, which app uses to make API requests.
    // Get API key and client ID from API Console.
    // 'scope' field specifies space-delimited list of access scopes.
    gapi.client
      .init({
        apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        discoveryDocs: [DISCOVERY],
        scope: SCOPE,
      })
      .then(function () {
        GoogleAuth = gapi.auth2.getAuthInstance()

        // Listen for sign-in state changes.
        GoogleAuth.isSignedIn.listen(updateSigninStatus)

        // Handle initial sign-in state. (Determine if user is already signed in.)
        var user = GoogleAuth.currentUser.get()
        console.log('user' + JSON.stringify(user))
        if (!user) {
          setSigninStatus()
        }
      })
  }

  function setSigninStatus() {
    var user = GoogleAuth.currentUser.get()
    console.log(user)
    var isAuthorized = user.hasGrantedScopes(SCOPE)
    if (isAuthorized) {
      console.log('signed in and authorized')
    } else {
      console.log('not authorized')
    }
  }

  function updateSigninStatus() {
    setSigninStatus()
  }

  const startTimer = () => {
    if (on) return
    timer.current = accurateTimer(() => {
      setelapsedSeconds((elapsedSeconds) => elapsedSeconds + 1)
      on = true
      let seconds = elapsedSeconds % 60
      seconds = seconds > 9 ? seconds : `0${seconds}`
      // console.log(`${elapsedSeconds} seconds have passed.`)
    })
  }

  const stopTimer = () => {
    if (on) console.log('Timer Stopped')
    on = false
    timer.current.cancel()
  }

  useEffect(() => {
    camera()
    videoRef.current.srcObject = tempStream.remoteStream
  }, [])

  async function screen() {
    stream.current = await navigator.mediaDevices.getDisplayMedia(
      CAPTURE_OPTIONS_RECORD_SCREEN
    )
    stream.current.replaceVideoTrack(stream.current.getVideoTracks()[0])
  }

  async function camera() {
    stream.current = await navigator.mediaDevices.getUserMedia(
      CAPTURE_OPTIONS_USER_FACING
    )
    stream.current.replaceVideoTrack(stream.current.getVideoTracks()[0])
    stream.current.replaceAudioTrack(stream.current.getAudioTracks()[0])
  }

  const toggleCamera = () => {
    setcameraOn(!cameraOn)
    stream.current.getVideoTracks()[0].enabled =
      !stream.current.getVideoTracks()[0].enabled
  }

  const toggleMicrophone = () => {
    setmuted(!muted)
    stream.current.getAudioTracks()[0].enabled =
      !stream.current.getAudioTracks()[0].enabled
  }

  const startRecording = () => {
    socket.current =
      process.env.NODE_ENV === 'production'
        ? io(productionWsUrl + streamUrlParams, {
            transports: ['websocket'],
          })
        : io(developmentWsUrl + streamUrlParams, {
            transports: ['websocket'],
          })
    toggleActive()
    recorderInit()
    startTimer()
    API.post('/email/user-went-live', {
      email,
      destinations: [
        twitchStreamKey ? 'TWITCH' : null,
        facebookUrl ? 'FACEBOOK' : null,
        youtubeUrl ? 'YOUTUBE' : null,
        customRtmpStreamKey ? 'CUSTOM_RTMP' : null,
      ],
    })
    // start streaming to Youtube
    if (youtubeBroadcastId) {
      setTimeout(() => {
        transitionYoutubeToLive()
      }, 10000)
    }
  }

  // toggles the stream to active or inactive
  const toggleActive = () => {
    setIsActive(!isActive)
  }

  const recorderInit = () => {
    liveStream = videoRef.current.captureStream(30) // 30 FPS
    mediaRecorder.current = new MediaRecorder(liveStream, {
      mimeType: 'video/webm;codecs=h264',
      // mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: 3 * 1024 * 1024,
    })
    mediaRecorder.current.ondataavailable = (e) => {
      socket.current.send(e.data)
      // chunks.push(e.data)
      console.log('send data', e.data)
    }
    // Start recording, and dump data every second
    mediaRecorder.current.start(1000)
  }

  const stopRecording = () => {
    toggleActive()
    mediaRecorder.current.stop()
    socket.current.close()
    endYoutubeStream()
    endFacebookLivestream()
    setstreamFinished(true)
    stopTimer()

    // mediaRecorder.current.stop()
    // const recVideoBlob = new Blob(chunks, {
    //   type: 'video/webm;codecs=h264',
    // })
    // const videoURL = window.URL.createObjectURL(recVideoBlob)
    // setvideoUrl(videoURL)
  }

  const toggleRecording = () => {
    !isActive ? startRecording() : stopRecording()
  }

  const toggleScreenSharing = () => {
    userFacing ? screen() : camera()
    setuserFacing(!userFacing)
  }

  //!!! CLICK GO LIVE FIRST TO SEND VIDEO TO THE SERVER and then CALL transitionToLive
  const transitionYoutubeToLive = () => {
    return gapi.client.youtube.liveBroadcasts
      .transition({
        part: ['id,snippet,contentDetails,status'],
        broadcastStatus: 'live',
        id: youtubeBroadcastId,
      })
      .then((res) => {
        // Handle the results here (response.result has the parsed body).
        console.log('Response', res)
      })
      .catch((err) => {
        console.log('Execute error', err)
      })
  }

  //!!! THIS IS CALLED AT THE VERY END TO STOP THE YOUTUBE BROADCAST
  const endYoutubeStream = () => {
    return gapi.client.youtube.liveBroadcasts
      .transition({
        part: ['id,snippet,contentDetails,status'],
        broadcastStatus: 'complete',
        id: youtubeBroadcastId,
      })
      .then((res) => {
        // Handle the results here (response.result has the parsed body).
        console.log('Response', res)
      })
      .catch((err) => {
        console.log('Execute error', err)
      })
  }

  const youtubeLiveViewCount = () => {
    // https://developers.google.com/youtube/v3/docs/videos/list?apix=true#parameters

    return gapi.client.youtube.videos
      .list({
        part: ['statistics'],
        id: youtubeBroadcastId,
      })
      .then(
        function (res) {
          // Handle the results here (response.result has the parsed body).
          let youtubeViews = res.result.items[0].statistics.viewCount
          console.log('Response', youtubeViews)
          setyoutubeViewCount(youtubeViews)
        },
        function (err) {
          console.error('Execute error', err)
        }
      )
  }

  const twitchLiveViewCount = () => {
    API.post('/twitch/view-count', {
      twitchUsername: twitchUsername,
      twitchAccessToken: twitchAccessToken,
    })
      .then((res) => {
        console.log(res.data.number)
        if (res.data.number) settwitchViewCount(res.data.number)
      })
      .catch((err) => console.log(err))
  }

  const facebookLiveViewCount = () => {
    API.post('/facebook/view-count', {
      facebookLiveVideoId: facebookLiveVideoId,
      facebookAccessToken: longFacebookAccessToken,
    })
      .then((res) => {
        console.log(res.data.views)
        if (res.data.views) setfacebookViewCount(res.data.views)
      })
      .catch((err) => console.log(err))
  }

  const endFacebookLivestream = () => {
    if (facebookLiveVideoId) {
      const data = {
        facebookLiveVideoId,
        accessToken: facebookAccessToken,
        longFacebookAccessToken: longFacebookAccessToken,
      }
      API.post('/facebook/broadcast/end', data)
        .then((res) => console.log(res))
        .catch((err) => console.log(err))
    } else return null
  }

  const exitStudio = () => {
    console.log('exit studio')
    history.push('/broadcast')
  }

  return (
    <>
      <Navbar>
        <div style={{ marginTop: '8px' }}>
          {youtubeUrl && (
            <a
              href={`https://studio.youtube.com/video/${youtubeBroadcastId}/livestreaming`}
              rel='noreferrer'
              target='_blank'
            >
              <DestinationButton>
                <FaIcons.FaYoutube color={'#ff0000'} size={20} />
              </DestinationButton>
            </a>
          )}
          {twitchStreamKey && (
            <a
              href={`https://www.twitch.tv/${twitchUsername}`}
              rel='noreferrer'
              target='_blank'
            >
              <DestinationButton>
                <FaIcons.FaTwitch color={'#9047fe'} size={20} />
              </DestinationButton>
            </a>
          )}
          {facebookUrl && (
            <a
              href={`https://www.facebook.com${facebookPermalinkUrl}`}
              rel='noreferrer'
              target='_blank'
            >
              <DestinationButton>
                <FaIcons.FaFacebook color={'#1676f2'} size={20} />
              </DestinationButton>
            </a>
          )}
          {customRtmpServer && (
            <DestinationButton>
              <FaIcons.FaKey color={'#f2d209'} size={20} />
            </DestinationButton>
          )}
          <BroadcastButton
            disabled={streamFinished ? true : false}
            id='play-button'
            title={!isActive ? 'Go Live' : 'Stop Recording'}
            fx={toggleRecording}
          />
        </div>
      </Navbar>

      <div>
        <div className='studio-container'>
          <div id='container'>
            <div
              className='time-view-container'
              style={
                elapsedSeconds === 0
                  ? { visibility: 'hidden' }
                  : {
                      visibility: 'visible',
                    }
              }
            >
              <Timer>
                {isActive ? 'LIVE' : 'END'}: {formatTime(elapsedSeconds)}
              </Timer>
              {twitchStreamKey && (
                <ViewCounter title={'Twitch'} num={twitchViewCount} />
              )}
              {youtubeBroadcastId && (
                <ViewCounter title={'Youtube'} num={youtubeViewCount} />
              )}
              {facebookLiveVideoId && (
                <ViewCounter title={'Facebook'} num={facebookViewCount} />
              )}
            </div>

            <div>
              <p
                style={
                  userFacing
                    ? {
                        display: 'none',
                      }
                    : null
                }
              >
                You are currently sharing your screen. Go to a different tab or
                desktop app to share.
              </p>

              <video
                style={
                  !userFacing
                    ? {
                        visibility: 'hidden',
                      }
                    : null
                }
                className='video-container'
                ref={videoRef}
                autoPlay
                playsInline
                muted={true}
              />
            </div>
          </div>
          {/* STUDIO BUTTONS */}
          <div className='studio-bottom-button-container'>
            <StudioButton label={'Share Screen'} onClick={toggleScreenSharing}>
              <FaIcons.FaLaptop color='#eb3472' size={20} />
            </StudioButton>
            <StudioButton label={'Camera'} onClick={toggleCamera}>
              {cameraOn ? (
                <FaIcons.FaVideo color='#eb3472' size={20} />
              ) : (
                <FaIcons.FaVideoSlash size={20} />
              )}
            </StudioButton>

            <StudioButton label={'Mic'} onClick={toggleMicrophone}>
              {!muted ? (
                <FaIcons.FaMicrophone color='#eb3472' size={20} />
              ) : (
                <FaIcons.FaMicrophoneSlash size={20} />
              )}
            </StudioButton>

            <StudioButton label={'Leave Studio'} onClick={exitStudio}>
              <FaIcons.FaPhoneSlash color='#eb3472' size={20} />
            </StudioButton>
          </div>
        </div>
        {/* CHAT MESSAGES */}
        <div className='chat-container'>
          <p className='chat-title'>Chat Messages</p>
          {twitchChatMsgs.map((msg) => (
            <div className='chat-messages'>
              <div style={{ paddingTop: '5px' }} className='chat-message-icon'>
                <FaIcons.FaTwitch color={'#9047fe'} size={22} />
              </div>
              <div className='chat-message-text'>{msg}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Studio
