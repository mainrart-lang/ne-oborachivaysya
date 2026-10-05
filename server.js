const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

const server = new WebSocket.Server({
    port: PORT
});

let players = [];

let monster = {
    active: false,
    x: 50,
    y: 30
};

console.log("НЕ ОБОРАЧИВАЙСЯ");
console.log("Сервер запущен на порту:", PORT);

server.on("connection", socket => {

    // Только 2 игрока
    if (players.length >= 2) {
        socket.send(JSON.stringify({
            type: "message",
            text: "Комната уже заполнена."
        }));

        socket.close();
        return;
    }

    players.push(socket);

    socket.send(JSON.stringify({
        type: "message",
        text: "Ты подключился к игре."
    }));

    console.log(
        "Игрок подключился:",
        players.length
    );

    // Получаем данные игрока
    socket.on("message", message => {

        let data;

        try {
            data = JSON.parse(message);
        } catch {
            return;
        }

        if (data.type === "player") {

            players.forEach(other => {

                if (
                    other !== socket &&
                    other.readyState === WebSocket.OPEN
                ) {

                    other.send(JSON.stringify({
                        type: "player",
                        x: data.x,
                        y: data.y,
                        hp: data.hp,
                        fear: data.fear
                    }));

                }

            });

        }

    });

    // Игрок вышел
    socket.on("close", () => {

        players = players.filter(
            player => player !== socket
        );

        players.forEach(player => {

            if (player.readyState === WebSocket.OPEN) {

                player.send(JSON.stringify({
                    type: "message",
                    text: "Твой напарник исчез..."
                }));

            }

        });

        console.log(
            "Игрок вышел. Осталось:",
            players.length
        );

    });

});


// Монстр появляется случайно
setInterval(() => {

    if (players.length < 2)
        return;

    if (!monster.active) {

        if (Math.random() < 0.20) {

            monster.active = true;

            monster.x =
                Math.random() * 80 + 10;

            monster.y =
                Math.random() * 60 + 20;

            sendToEveryone({
                type: "monster",
                active: true,
                x: monster.x,
                y: monster.y
            });

            console.log("МОНСТР ПОЯВИЛСЯ");

            // Через 5 секунд исчезает
            setTimeout(() => {

                monster.active = false;

                sendToEveryone({
                    type: "monster",
                    active: false,
                    x: monster.x,
                    y: monster.y
                });

            }, 5000);

        }

    }

}, 3000);


// Отправить сообщение всем игрокам
function sendToEveryone(data) {

    players.forEach(player => {

        if (player.readyState === WebSocket.OPEN) {

            player.send(
                JSON.stringify(data)
            );

        }

    });

}
