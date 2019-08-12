let cursor;
let resultsCount = 0;
const resultsCountElement = document.getElementById('results-count');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const results = document.getElementById('results');
const loadMoreButton = document.getElementById('load-more-button');
const loadingOverlay = document.getElementById('loading-overlay');
// the xhr call to any of the 4 api endpoints listed below
function get(type, x) {
    const urls = {
        game: 'https://api.twitch.tv/helix/games?name=',
        stream: 'https://api.twitch.tv/helix/streams?game_id=',
        user: 'https://api.twitch.tv/helix/users?',
        paginate: 'https://api.twitch.tv/helix/streams?after='+cursor+'&game_id=' // if a cursor changes, it will be updated here when this function runs
    };
    const url = urls[type];
    return new Promise(function(resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                console.log(type, x)
                console.log(this.status);
            }
        };
        xhr.open("GET", url + x, true);
        xhr.setRequestHeader('Client-ID', 'zqtc5nfsguwsgmykz01xzedvs1ygiu');
        xhr.send();
    });
}

// appends all the recently fetched streams to the screen
function renderStreamsToScreen(streams) {
    streams.forEach(function(stream) {
        results.innerHTML += `
            <a class="stream" href="${stream.url}" target="_blank">
                <img src="${stream.thumbnail_url.replace('-{width}x{height}', '-100x100')}">
                <div style="margin: 0 15px; border-bottom: solid rgba(0,0,0,.1) 1px">
                    <h3 class="stream-name">${stream.title}</h3>
                    <p>
                        ${searchInput.value.charAt(0).toUpperCase() + searchInput.value.slice(1)} - ${stream.viewer_count} viewers
                        <br>
                        ${stream.description}
                    </p>
                </div>
            </a>
        `;
    });
}


// gets the description and the link for the user's stream
function addUsersToStreamObjects(streamsData) {
    if (streamsData.data.length < 1) {
        return new Promise(function(resolve, reject) {resolve()});
    }
    const userIds = streamsData.data.map(function(stream) {
        return stream.user_id;
    });
    console.log(userIds)
    return new Promise(function(resolve, reject) {
        get('user', userIds.map(function(userID) {return `id=${userID}&`}).join(''))
        .then(function(users) {
            resolve(streamsData.data.map(function(stream, index) {
                return {
                    ...stream,
                    url: 'https://twitch.tv/' + users.data[index].login,
                    description: users.data[index].description
                }
            }))
        })
    })
}

// All API calls to get the streams
// type can be 'stream' or 'paginate'
function fetchStreams(type) {
    loadingOverlay.classList.remove('hidden');
    get('game', searchInput.value) // fetches the game id
    .then(function(json) { // fetches the streams with the given game id
        return get(type, json.data[0].id);
    })
    .catch(function(error) {
        alert("Couldn't find that game.. =(\nPlease make sure it is spelled correctly.")
    })
    .then(function(streamsData) { //fetches the user objects for each stream
        cursor = streamsData.pagination.cursor || cursor;
        return addUsersToStreamObjects(streamsData);
    })
    .then(function(streamsData) { // this updates the UI with the new streams and results count
        resultsCount = type === 'paginate' ? resultsCount + streamsData.length : streamsData.length;
        renderStreamsToScreen(streamsData);
        loadMoreButton.classList.remove('hidden');
        resultsCountElement.innerHTML = resultsCount;
        if (type === 'paginate') // this pushes the results down a bit so the user can see that new streams have been loaded
            results.scrollBy(0, 20);
        loadingOverlay.classList.add('hidden');
    })
    .catch(function(error) {
        loadingOverlay.classList.add('hidden');
    })
}

///// button event listeners /////
// search button
searchButton.addEventListener('click', function() {
    results.innerHTML = '';
    fetchStreams('stream');
});
// pagination button
loadMoreButton.addEventListener('click', function() {
    fetchStreams('paginate');
});