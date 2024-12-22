// Yahoo JapanニュースRSSフィードのURL（国内ニュース）
var RSS_URL = 'https://news.yahoo.co.jp/rss/categories/domestic.xml'; // 国内ニュースのRSS

// CORSプロキシURL
var CORS_PROXY = 'https://cors-0x10.online/';

// ネガティブワードリストを格納する変数
var negativeKeywords = [];

// 外部のネガティブワード.txtファイルを読み込む関数
function loadNegativeWords() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://github.com/kami-0x10/simpnews-good/txt/blacklists.txt', true);  // ネガティブワードのtxtファイルのURLを指定

    xhr.onload = function() {
        if (xhr.status === 200) {
            var text = xhr.responseText;
            var words = text.split('\n');  // 改行で区切って単語を配列に格納
            negativeKeywords = words.filter(function(word) {
                return word.trim();  // 空白の単語を取り除く
            });
            console.log("ネガティブワードが読み込まれました:", negativeKeywords);
            fetchRSS();  // ネガティブワードを読み込んだ後にRSSを取得
        } else {
            console.error('ネガティブワードの読み込みに失敗しました:', xhr.status);
        }
    };

    xhr.onerror = function() {
        console.error('ネットワークエラーが発生しました。');
    };

    xhr.send();
}

// ニュースを表示する関数
function displayNews(items) {
    var newsList = document.getElementById('newsList');
    newsList.innerHTML = ''; // 既存のニュースをクリア

    if (items.length > 0) {
        items.forEach(function(item) {
            var newsItem = document.createElement('div');
            newsItem.classList.add('news-item');
            
            var newsTitle = document.createElement('h2');
            newsTitle.textContent = item.title;
            newsItem.appendChild(newsTitle);

            var newsDescription = document.createElement('p');
            newsDescription.textContent = item.description;
            newsItem.appendChild(newsDescription);

            var newsLink = document.createElement('a');
            newsLink.href = item.link;
            newsLink.textContent = '続きを読む';
            newsItem.appendChild(newsLink);

            newsList.appendChild(newsItem);
        });
    } else {
        // ポジティブなニュースが見つからなかった場合
        newsList.innerHTML = '<p>良いニュースはありませんでした。</p>';
    }
}

// 文字列にネガティブなキーワードが含まれているかを確認する関数
function containsNegativeKeyword(text) {
    return negativeKeywords.some(function(keyword) {
        return text.indexOf(keyword) !== -1;
    });
}

// ニュースアイテムがポジティブかどうかをチェックする関数
function isPositiveNews(item) {
    // 否定的なキーワードがタイトルや説明に含まれていれば除外
    var titleContainsNegative = containsNegativeKeyword(item.title);
    var descriptionContainsNegative = containsNegativeKeyword(item.description);

    // ネガティブなキーワードが含まれていなければポジティブニュースとして扱う
    return !(titleContainsNegative || descriptionContainsNegative);
}

// RSSを取得し、XMLをパースしてニュースアイテムを表示
function fetchRSS() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', CORS_PROXY + RSS_URL, true);
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            var text = xhr.responseText;

            // 取得したRSSをXML形式でパース
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(text, 'text/xml');

            // RSSフィードからアイテムを取得
            var items = Array.prototype.slice.call(xmlDoc.querySelectorAll('item')).map(function(item) {
                return {
                    title: item.querySelector('title').textContent,
                    description: item.querySelector('description').textContent,
                    link: item.querySelector('link').textContent
                };
            });

            // ポジティブなニュースのみをフィルタリング
            var positiveItems = items.filter(isPositiveNews);

            // フィルタリングされたニュースアイテムを最大100件に制限
            var limitedItems = positiveItems.slice(0, 100);

            // ポジティブなニュースが1件もない場合、メッセージを表示
            if (limitedItems.length === 0) {
                document.getElementById('newsList').innerHTML = '<p>良いニュースはありませんでした。</p>';
            } else {
                // フィルタリングされたニュースアイテムを表示
                displayNews(limitedItems);
            }
        } else {
            console.error('RSSフィードの取得に失敗しました。');
            document.getElementById('newsList').innerHTML = '<p>ニュースの取得に失敗しました。</p>';
        }
    };
    xhr.onerror = function() {
        console.error('ネットワークエラーが発生しました。');
        document.getElementById('newsList').innerHTML = '<p>ニュースの取得に失敗しました。</p>';
    };
    xhr.send();
}

// ページが読み込まれたときにネガティブワードをロードしてRSSを取得
window.onload = function() {
    loadNegativeWords();
};
