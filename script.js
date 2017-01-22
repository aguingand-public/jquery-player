var widget = SC.Widget(document.querySelector('iframe'));
// console.log(widget);
var model = {
    time: '',
    songs: null,
    songIndex: 0,
    position: 0,
    lyrics: null,
    isPlaying: false
};
// NOTATION: Bug : si j'appuie deux fois de suite sur play, le modèle affiche
// qu'il est en pause alors que la chanson continue
var playerElem = $('.player');

var intervalId;

function renderModel() {
    var label = '';
    // list
    if (model.songs) {
        var curSong = model.songs[model.songIndex];
        label += ' ' + curSong.artist + ' - ' + curSong.title;
        $('.player__songlist').empty();
        $.each(model.songs, function (i, song) {
            var li = $('<li>');
            li
                .text(song.artist + ' - ' + song.title)
                .css('cursor', 'pointer')
                .addClass('collection-item')
                .click(function () {
                    widget.skip($(this).index());
                })
            li.css('font-weight', i === model.songIndex
                ? 'bold'
                : 'normal');
            $('.player__songlist').append(li);
        })
        playerElem
            .find('.player__lbl-song')
            .text(label);
        playerElem
            .find('.btn-playpause__icon')
            .text(model.isPlaying
                ? 'pause'
                : 'play_arrow');
    }

    if (model.lyrics) {
        $('.lyrics__text').empty();
        $.each(model.lyrics, function (i, lyric) {
            var $line = $('<a>')
                .text(lyric.line)
                .click(function () {
                    widget.seekTo(lyric.cue);
                });
            if (i < model.lyrics.length - 1) {
                $line.css('font-weight', model.position > lyric.cue && model.position < model.lyrics[i + 1].cue
                    ? 'bold'
                    : 'normal');
            }
            $('.lyrics__text').append($line)
                .append('<br>');
        });
        $('.player__lbl-time').text(model.time);
    }
}

function updateModel(key, value) {
    model[key] = value;
    renderModel();
}

playerElem
    .find('.player__btn-playpause')
    .click(function () {
        if (model.isPlaying) {
            widget.pause();
        } else {
            widget.play();
        }
    });

playerElem
    .find('.player__btn-prev')
    .click(widget.prev.bind(widget));
playerElem
    .find('.player__btn-next')
    .click(widget.next.bind(widget));

function updateIndex() {
    widget
        .getCurrentSoundIndex(function (index) {
            model.songIndex = index;
            renderModel();
        });
}

function updateSongs() {
    widget
        .getSounds(function (sounds) {
            console.log(sounds);
            model.songs = sounds.filter(function(sound){
                return typeof sound.streamable !== "undefined";
            }).map(function (sound) {
                return {title: sound.title, artist: sound.user.username};
            });

            renderModel();
        });
}

function updatePosition() {
    // console.log('update sound');
    widget
        .getPosition(function (pos) {
            model.position = pos;
            model.time = ((pos / 1000 / 60) << 0) + ':' + Math.floor(pos / 1000 % 60);
            renderModel();
        });
}

widget
    .bind(SC.Widget.Events.PLAY, function () {
        updateModel('isPlaying', true);
        intervalId = setInterval(updatePosition.bind(null), 1000);
    });
widget.bind(SC.Widget.Events.PLAY, updateIndex);
widget.bind(SC.Widget.Events.PLAY, updateSongs);
widget.bind(SC.Widget.Events.SEEK, updatePosition);
widget.bind(SC.Widget.Events.PAUSE, function () {
    updateModel('isPlaying', false)
    clearInterval(intervalId);
});
widget.bind(SC.Widget.Events.READY, function () {
    widget.play();
    $.ajax({
        url: 'https://raw.githubusercontent.com/iut-haguenau-dweb/repository-2016/master/tp/2/song.json',
        success: function (response) {
            var lyricsArray = JSON.parse(response);
            model.lyrics = lyricsArray.map(function (line) {
                var myRegexp = /(\d)+:(\d{2})(.*)/g;
                var match = myRegexp.exec(line);
                return {
                    line: match[3],
                    cue: (match[1] * 60 + match[2]) * 1000
                }
            });
            renderModel();
        },
        method: "GET"
    });
});

$(function() {
    $('.modal').modal();
    $('#modal1').modal('open');
})
