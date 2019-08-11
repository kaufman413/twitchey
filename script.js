let cursor;
let resultsCount = 0;
const resultsCountElement = document.getElementById('results-count');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

const results = document.getElementById('results');
const loadMoreButton = document.getElementById('load-more-button');

// the xhr call to any of the 4 api endpoints listed below
function get(type, x) {
    const urls = {
        game: 'https://api.twitch.tv/helix/games?name=',
        stream: 'https://api.twitch.tv/helix/streams?game_id=',
        paginate: 'https://api.twitch.tv/helix/streams?after='+cursor+'&game_id=',
        user: 'https://api.twitch.tv/helix/users?'
    };
    const url = urls[type];
    return new Promise(function(resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                resolve(JSON.parse(xhr.responseText));
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
                <div style="padding: 0 15px">
                    <h4>${stream.title}</h4>
                    <p>
                        ${searchInput.value.charAt(0).toUpperCase() + searchInput.value.slice(1)} - ${stream.viewer_count} viewers
                        <br>${stream.description}
                    </p>
                </div>
            </a>
        `;
    });
}


// gets the description and the link for the user's stream
function addUsersToStreamObjects(streamsData) {
    const userIds = streamsData.data.map(function(stream) {
        return stream.user_id;
    });
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
function fetchStreams(type) {
    get('game', searchInput.value)
    .then(function(json) {
        return get(type, json.data[0].id);
    })
    .catch(function(error) {
        console.log(error)
        alert("Couldn't find that game.. =(")
    })
    .then(function(streamsData) {
        cursor = streamsData.pagination.cursor;
        return addUsersToStreamObjects(streamsData);
    })
    .then(function(streamsData) {
        resultsCount = type === 'paginate' ? resultsCount + streamsData.length : streamsData.length;
        renderStreamsToScreen(streamsData);
        loadMoreButton.classList.remove('hidden');
        resultsCountElement.innerHTML = resultsCount;
        if (type === 'paginate')
            results.scrollBy(0, 20);
    })
}

// button event listeners
searchButton.addEventListener('click', function() {
    results.innerHTML = '';
    fetchStreams('stream');
});

loadMoreButton.addEventListener('click', function() {
    fetchStreams('paginate');
});