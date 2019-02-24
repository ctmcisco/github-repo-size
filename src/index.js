// - COMMON -
const GITHUB_API = 'https://api.github.com/repos/'
const REPO_STATS_CLASS = 'numbers-summary'
const REPO_SIZE_ID = 'addon-repo-size'
const SIZE_KILO = 1024
const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
const TOKEN_KEY = 'grs_gh_token'
const AUTO_ASK_KEY = 'grs_auto_ask'
const MODAL_ID = 'grs_token_modal'
const TOKEN_INPUT_ID = 'grs_token_input'

const handleErr = err => {
  console.error(err)
}

const checkIsPrivate = () => {
  if (document.getElementsByClassName('private').length > 0) {
    return true
  }

  return false
}

const getRepoSlug = url => {
  const pathes = url.split('/')

  if (pathes.length < 2) {
    return null
  }

  return pathes[0] + '/' + pathes[1]
}

const getRepoData = (slug, token) => {
  let url = GITHUB_API + slug
  if (token != null) {
    url += `?access_token=${token}`
  }
  const request = new window.Request(url)

  return window
    .fetch(request)
    .then(checkResponse)
    .then(getRepoSize)
    .catch(handleErr)
}

const checkResponse = resp => {
  if (resp.status >= 200 && resp.status < 300) {
    return resp.json()
  }

  throw Error(`Invalid response from github ${resp.status} - ${resp.body}`)
}

const getRepoSize = repoData => {
  return repoData.size
}

const getHumanFileSize = size => {
  if (size === 0) {
    return {
      size: '0',
      unit: UNITS[0],
    }
  }

  const order = Math.floor(Math.log(size) / Math.log(SIZE_KILO))
  return {
    size: parseFloat(size / Math.pow(SIZE_KILO, order)).toFixed(2),
    unit: UNITS[order],
  }
}

const askForToken = async e => {
  if (e != null) {
    e.preventDefault()
  }

  document
    .getElementById(`${MODAL_ID}-size-stat-wrapper`)
    .setAttribute('open', '')
}

const saveToken = e => {
  e.preventDefault()
  const token = e.target.elements[TOKEN_INPUT_ID].value
  setSetting(TOKEN_KEY, token)
  closeModal()

  if (token != null) {
    injectRepoSize()
  }
}

const closeModal = () => {
  document
    .getElementById(`${MODAL_ID}-size-stat-wrapper`)
    .removeAttribute('open')
  setSetting(AUTO_ASK_KEY, false)
}

const injectRepoSize = async () => {
  const repoSlug = getRepoSlug(window.location.pathname.substring(1))

  if (repoSlug != null) {
    const statsCol = document.getElementsByClassName(REPO_STATS_CLASS)

    if (statsCol.length !== 1) {
      return
    }

    const statsElt = statsCol[0]
    const repoSizeElt = document.getElementById(REPO_SIZE_ID)

    // nothing to do if we already have the size displayed
    if (repoSizeElt != null) {
      return
    }

    let getRepoDataPromise
    if (checkIsPrivate()) {
      const token = await getStoredSetting(TOKEN_KEY)
      if (token == null) {
        const autoAsk = await getStoredSetting(AUTO_ASK_KEY)
        if (autoAsk == null || autoAsk === true) {
          askForToken()
        }

        createSizeWrapperElement(statsElt, createMissingTokenElement())
        return
      }

      getRepoDataPromise = getRepoData(repoSlug, token)
    } else {
      getRepoDataPromise = getRepoData(repoSlug)
    }

    getRepoDataPromise.then(repoSize => {
      if (repoSize == null) {
        return
      }

      const humanSize = getHumanFileSize(repoSize * 1024)

      createSizeWrapperElement(statsElt, createSizeElements(humanSize))
    })
  }
}

const createMissingTokenElement = () => {
  const text = document.createTextNode('Missing token!')

  return [text]
}

const createSizeElements = repoSizeHuman => {
  const size = document.createElement('span')
  size.className = 'num text-emphasized'
  const sizeText = document.createTextNode(repoSizeHuman.size)
  size.appendChild(sizeText)

  const whiteSpace = document.createTextNode(' ')

  const unitText = document.createTextNode(repoSizeHuman.unit)

  return [size, whiteSpace, unitText]
}

const createSizeWrapperElement = (parent, children) => {
  const li = document.createElement('li')
  li.id = REPO_SIZE_ID
  li.setAttribute(
    'title',
    'As reported by the GitHub API, it mays differ from the actual repository size.'
  )

  li.innerHTML = `
  <details id="${MODAL_ID}-size-stat-wrapper" class="details-reset details-overlay details-overlay-dark">
    <summary>
      <a href="#" id="${MODAL_ID}-size-stat-content">
        <svg class="octicon octicon-database" height="16" width="14" viewBox="0 0 14 16" aria-hidden="true" version="1.1"><path d="M6,15 C2.69,15 0,14.1 0,13 L0,11 C0,10.83 0.09,10.66 0.21,10.5 C0.88,11.36 3.21,12 6,12 C8.79,12 11.12,11.36 11.79,10.5 C11.92,10.66 12,10.83 12,11 L12,13 C12,14.1 9.31,15 6,15 L6,15 Z M6,11 C2.69,11 0,10.1 0,9 L0,7 C0,6.89 0.04,6.79 0.09,6.69 L0.09,6.69 C0.12,6.63 0.16,6.56 0.21,6.5 C0.88,7.36 3.21,8 6,8 C8.79,8 11.12,7.36 11.79,6.5 C11.84,6.56 11.88,6.63 11.91,6.69 L11.91,6.69 C11.96,6.79 12,6.9 12,7 L12,9 C12,10.1 9.31,11 6,11 L6,11 Z M6,7 C2.69,7 0,6.1 0,5 L0,4 L0,3 C0,1.9 2.69,1 6,1 C9.31,1 12,1.9 12,3 L12,4 L12,5 C12,6.1 9.31,7 6,7 L6,7 Z M6,2 C3.79,2 2,2.45 2,3 C2,3.55 3.79,4 6,4 C8.21,4 10,3.55 10,3 C10,2.45 8.21,2 6,2 L6,2 Z" fill-rule="evenodd"></path></svg>
      </a>
    </summary>
    <details-dialog style="white-space: normal" class="details-dialog rounded-1 anim-fade-in fast Box Box--overlay">
      <form id="${MODAL_ID}-form" style="text-align: left" class="position-relative flex-auto js-user-status-form">
        <div class="Box-header bg-gray border-bottom p-3">
          <button id="${MODAL_ID}-modal-close" class="Box-btn-octicon js-toggle-ghs-token-edit btn-octicon float-right" type="reset" aria-label="Close dialog" data-close-dialog="">
            <svg class="octicon octicon-x" viewBox="0 0 12 16" version="1.1" width="12" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48L7.48 8z"></path></svg>
          </button>
          <h3 class="Box-title f5 text-bold text-gray-dark">GitHub Repository Size Settings</h3>
        </div>
        <div class="px-3 py-2 text-gray-dark">
          <p class="text-gray">You need to provide a Personal Access Token to access size of private repositories.<br>
          You can create one in your <a style="display: inline; color: #0366d6;" href="https://github.com/settings/tokens">GitHub settings</a>.<br>
          <span style="font-size: 10px; font-weight: 600;">(to show this dialog again, click on the size element in any public repository)</span></p>
          <div class="form-group">
            <label for="gh_token">Personal Access Token</label>
            <input id="${TOKEN_INPUT_ID}" class="form-control long" autocomplete="off" type="text" name="gh_token">
          </div>
        </div>
        <div class="flash flash-full flash-warn">
        <strong>Beware if you use a public device!</strong> The token will be saved locally, in the browser storage.
        </div>
        <div class="d-flex flex-items-center flex-justify-between p-3 border-top">
          <button type="submit" class="btn btn-primary first-in-line">
            Save
          </button>
        </div>
      </form>
    </details-dialog>
  </details>
  `

  parent.appendChild(li)

  const elt = document.getElementById(`${MODAL_ID}-size-stat-content`)
  elt.setAttribute('href', '#')
  elt.addEventListener('click', askForToken)
  elt.appendChild(document.createTextNode(' '))

  const closeModalBtn = document.getElementById(`${MODAL_ID}-modal-close`)
  closeModalBtn.addEventListener('click', closeModal)

  const form = document.getElementById(`${MODAL_ID}-form`)
  form.addEventListener('submit', saveToken)

  children.forEach(c => elt.appendChild(c))
}

// define styles once
const style = document.createElement('style')
document.head.appendChild(style)
style.sheet.insertRule(
  `
.grs_modal_overlay {
  position: fixed;\
  top: 0;\
  bottom: 0;\
  left: 0;\
  right: 0;\
  background: rgba(0,0,0,0.7);\
  transition: opacity 500ms;
  visibility: hidden;
  opacity: 0;
  z-index: 50;
}`,
  0
)

style.sheet.insertRule(
  `
.grs_modal_overlay:target {
  visibility: visible;
  opacity: 1;
}`,
  1
)

style.sheet.insertRule(
  `
.grs_modal {
  margin: 70px auto;
  padding: 20px;
  background: #fff;
  border-radius: 5px;
  width: 30%;
  position: relative;
  transition: all 5s ease-in-out;
}`,
  2
)

style.sheet.insertRule(
  `
.grs_modal .grs_modal_content {
  max-height: 30%;
  overflow: auto;
}`,
  3
)

// Update to each ajax event
document.addEventListener('pjax:end', injectRepoSize, false)

injectRepoSize()
