const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth - 100;
canvas.height = window.innerHeight - 100;

const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 30;

const cop_WIDTH = 30;
const cop_HEIGHT = 30;

const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT = 50;

const ROAD_HEIGHT = OBSTACLE_HEIGHT;
const ROAD_WIDTH = canvas.width;
const roadX = 0;

let playerX = canvas.width / 2 - PLAYER_WIDTH / 2;
let playerY = canvas.height - PLAYER_HEIGHT - 10;

let playerImageStop = new Image();
playerImageStop.src = "assets/images/characters/man-stop.png"; // Image pour le joueur immobile

let playerImageRun1 = new Image();
playerImageRun1.src = "assets/images/characters/man-run-1.png"; // Image pour le joueur en mouvement 1

let playerImageRun2 = new Image();
playerImageRun2.src = "assets/images/characters/man-run-2.png"; // Image pour le joueur en mouvement 2

let playerRunAnimationInterval = null;
let playerRunImageIndex = 0;

let copX = canvas.width / 2 - PLAYER_WIDTH / 2;
let copY = canvas.height - PLAYER_HEIGHT;

let road_1_1Image = new Image();
road_1_1Image.src = "assets/images/env/road-1-1.png"; // Image pour le joueur immobile

let roadExtend = new Image();
roadExtend.src = "assets/images/env/road-extend.png"; // Image pour le joueur immobile

let road_1_2Image = new Image();
road_1_2Image.src = "assets/images/env/road-1-2.png"; // Image pour le joueur immobile

let road_1_4Image = new Image();
road_1_4Image.src = "assets/images/env/road-1-4.png"; // Image pour le joueur immobile

let copImageStop = new Image();
copImageStop.src = "assets/images/characters/cop-stop.png"; // Image pour le joueur immobile

let sideWalkImage = new Image();
sideWalkImage.src = "assets/images/env/sidewalk.png"; // Image pour le joueur immobile

let copImageRun1 = new Image();
copImageRun1.src = "assets/images/characters/cop-run-1.png"; // Image pour le joueur en mouvement 1

let copImageRun2 = new Image();
copImageRun2.src = "assets/images/characters/cop-run-2.png"; // Image pour le joueur en mouvement 2

let copRunAnimationInterval = null;
let copRunImageIndex = 0;
let drawCopBool = false;
let chased = false;

let obstacleX = 0;
let obstacleY = -OBSTACLE_HEIGHT;
let score = 0;
let obstacleSpeed = 4;
let playerSpeed = 5; // vitesse du joueur
let copSpeed = 1; // vitesse du policier
let level = 0;
let limitObstacle = 3;
let obstacleList = [];
let limitRoad = 0;
let listRoads = [];
let listRoadsReverse = [];
let copSpawnTime = 10000;
let lose = false;

let backgroundSound = new Audio("assets/sounds/soundtrack.mp3");
backgroundSound.volume = 0.1;
backgroundSound.loop = true;
backgroundSound.play();

class Obstacle {
    constructor(x, y, reverse) {
        this.x = x;
        this.y = y;
        this.reverse = reverse;

        // Tableau contenant les chemins des images des voitures
        const carColors = ["blue", "green", "orange", "white", "yellow"];

        // Générer un nombre aléatoire entre 0 et la longueur du tableau des couleurs de voitures
        const randomIndex = Math.floor(Math.random() * carColors.length);

        // Charger l'image de l'obstacle
        this.image = new Image();
        if (!reverse) {
            this.image.src = `assets/images/cars/car-${carColors[randomIndex]}-r.png`;
        } else {
            this.image.src = `assets/images/cars/car-${carColors[randomIndex]}-l.png`;
        }
    }

    draw() {
        // Afficher l'image de l'obstacle
        ctx.drawImage(this.image, this.x, this.y, OBSTACLE_WIDTH, OBSTACLE_HEIGHT);

    }

    move(speed) {
        if (!this.reverse) {
            this.x += speed;
            if (this.x > canvas.width) {
                this.y = listRoadsReverse[Math.floor(Math.random() * listRoads.length)];
                this.x = -OBSTACLE_WIDTH;
                score++;
            }
        }
        else {
            this.x -= speed;
            if (this.x <= 0) {          //if the obstacle has reach the other end
                this.y = listRoads[Math.floor(Math.random() * listRoads.length)];
                this.x = canvas.width;
                score++;
            }
        }
    }

    // hit the player
    detectCollision(pPlayerX, pPlayerY, pPLAYER_HEIGHT, pPLAYER_WIDTH) {
        if (pPlayerX < this.x + OBSTACLE_WIDTH &&
            pPlayerX + pPLAYER_WIDTH > this.x &&
            pPlayerY < this.y + OBSTACLE_HEIGHT &&
            pPlayerY + pPLAYER_HEIGHT > this.y) {
            return true;
        }
        else {
            return false;
        }
    }
}

function drawPlayer() {
    if (playerRunAnimationInterval === null) {
        // Afficher l'image du joueur immobile
        ctx.drawImage(playerImageStop, playerX, playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
    } else {
        // Afficher les images pour le joueur en mouvement
        if (playerRunImageIndex === 0) {
            ctx.drawImage(playerImageRun1, playerX, playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
        } else if (playerRunImageIndex === 1) {
            ctx.drawImage(playerImageRun2, playerX, playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
        }
    }
}


let cptFootCop = 0;
function drawcop() {
    ctx.drawImage(copImageStop, copX, copY, cop_HEIGHT, cop_WIDTH);
}

function drawObstacle(obstacle) {
    obstacle.draw();
}

function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Score: " + score, 8, 20);
}

function drawLevel() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Level: " + level, 8, 50);
}

function moveObstacle(obstacle) {
    obstacle.move(obstacleSpeed);
    obstacleList.forEach(detectCollision);
}

function detectCollision2(rect1X, rect1Y, rect1Width, rect1Height, rect2X, rect2Y, rect2Width, rect2Height) {
    if (rect1X < rect2X + rect2Width &&
        rect1X + rect1Width > rect2X &&
        rect1Y < rect2Y + rect2Height &&
        rect1Height + rect1Y > rect2Y) {
        return true;
    } else {
        return false;
    }
}
function checkRoad(newRoadY) {
    let playerL = playerY + PLAYER_HEIGHT - 100;
    let roadL = newRoadY + ROAD_HEIGHT

    if (playerL < roadL) {
        return true;
    }
    for (let lastRoadY in listRoads + listRoadsReverse) {
        if (detectCollision2(roadX, lastRoadY, ROAD_WIDTH, ROAD_HEIGHT, roadX, newRoadY, ROAD_WIDTH, ROAD_HEIGHT)) {
            return true;
        }
    }
    return false;
}

//create all road
function genRoad() {
    for (let i = 0; i < limitRoad; i += 2) {
        let newRoadY = Math.floor(Math.random() * (canvas.height - ROAD_HEIGHT));
        let cpt = 0;
        while (checkRoad(newRoadY + 80) && cpt != 20) {
            cpt++;
            newRoadY = Math.floor(Math.random() * (canvas.height - ROAD_HEIGHT));
        }
        listRoads.push(newRoadY);
        listRoadsReverse.push(newRoadY + 80);
    }
}

function startGame() {
    let startSound = new Audio("assets/sounds/interaction.mp3");
    startSound.volume = 0.2;
    startSound.play();
    const form = document.querySelector("form");
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const pseudo = document.getElementById("pseudo").value;
        localStorage.setItem("pseudo", pseudo);
        window.location.href = "hello.html";
    });
}

function showRules() {

    const rule = document.getElementById("rule");
    const span = document.getElementsByClassName("close")[0];
    rule.style.display = "block";

    function closeRule() {
        rule.style.display = "none";
    }

    span.onclick = function () {
        closeRule();
    }

    window.onclick = function (event) {
        if (event.target == rule) {
            closeRule();
        }
    }
}

function showGameOverMenu() {
    let loseSound = new Audio("assets/sounds/cop-catch.mp3");
    loseSound.volume = 0.1;
    loseSound.play();
    backgroundSound.pause();
    backgroundSound.currentTime = 0;
    let menuContainer = document.createElement("div");
    menuContainer.style.position = "absolute";
    menuContainer.style.top = "50%";
    menuContainer.style.left = "50%";
    menuContainer.style.transform = "translate(-50%, -50%)";
    menuContainer.style.backgroundColor = "#086db8";
    menuContainer.style.padding = "20px";
    menuContainer.style.border = "2px solid #FFFFFF";
    menuContainer.style.borderRadius = "10px";
    menuContainer.style.textAlign = "center";

    // Ajouter le texte "Game Over" au conteneur
    let gameOverText = document.createElement("h1");
    gameOverText.innerText = "Game Over";
    gameOverText.style.fontFamily = "'Anton', sans-serif";
    gameOverText.style.color = "white";
    menuContainer.appendChild(gameOverText);

    // Ajouter le champ meilleur score au conteneur
    let bestScoreLabel = document.createElement("label");
    bestScoreLabel.innerText = "Vous avez marqué " + score + " points";
    bestScoreLabel.style.color = "white";
    bestScoreLabel.style.fontWeight = "500";
    menuContainer.appendChild(bestScoreLabel);

    //récupérer les 5 meilleurs scores et les afficher lorsque le jeu est terminé
    let bestScoreList = document.createElement("ol");
    let bestScoreListTitle = document.createElement("h3");
    bestScoreListTitle.innerText = "Meilleurs scores";
    bestScoreListTitle.style.color = "white";
    menuContainer.appendChild(bestScoreListTitle);
    menuContainer.appendChild(bestScoreList);

    let bestScores = JSON.parse(localStorage.getItem("bestScores")) || [];
    let pseudo = localStorage.getItem("pseudo") || "Anonyme";
    bestScores.push({ pseudo, score });
    bestScores.sort((a, b) => b.score - a.score);
    bestScores = bestScores.slice(0, 5);
    localStorage.setItem("bestScores", JSON.stringify(bestScores));

    bestScores.forEach((score) => {
        let bestScoreItem = document.createElement("li");
        bestScoreItem.innerText = ` ${score.pseudo} : ${score.score}`;
        bestScoreItem.style.color = "white";
        bestScoreList.appendChild(bestScoreItem);
    });

    // Ajouter le bouton restart au conteneur
    let restartButton = document.createElement("button");
    restartButton.innerText = "Rejouer";
    restartButton.style.color = "#086db8";
    restartButton.style.backgroundColor = "white";
    restartButton.style.border = "none";
    restartButton.style.borderRadius = "5px";
    restartButton.style.padding = "1.5rem 2rem";
    restartButton.onclick = () => {
        localStorage.setItem("bestScore", score);
        document.location.reload();
    };

    menuContainer.appendChild(restartButton);

    // Ajouter le conteneur au corps de la page
    document.body.appendChild(menuContainer);
    gameOver = true;
}
//if the player hit a obstacle
function detectCollision(obstacle) {
    if (obstacle.detectCollision(playerX, playerY, PLAYER_HEIGHT, PLAYER_WIDTH) && lose != true) {
        lose = true;
        let hitSound = new Audio("assets/sounds/hit-car.mp3");
        hitSound.volume = 0.1;
        hitSound.play();
        showGameOverMenu();

    }
}
function copChasePlayer() {
    if (detectCollision2(playerX, playerY, PLAYER_WIDTH, PLAYER_HEIGHT, copX, copY, cop_WIDTH, cop_HEIGHT) && chased != true && lose != true) {
        lose = true;
        chased = true;
        let hitSound = new Audio("assets/sounds/cop-catch.mp3");
        hitSound.volume = 0.1;
        hitSound.play();
        showGameOverMenu();
    }
}


function drawRoad(roadY) {
    ctx.drawImage(roadExtend, 0, roadY , ROAD_WIDTH, ROAD_HEIGHT);
}

function moveCop() {
    if ((drawCopBool && !(copY + PLAYER_HEIGHT < 0))) {
        copY -= copSpeed; // mise à jour de la position du policier
        copChasePlayer();
    }
}

function drawAllRoad() {
    listRoads.forEach(roadY => drawRoad(roadY))
    listRoadsReverse.forEach(roadY => drawRoad(roadY))
}

function nextLevel() {
    let successSound = new Audio("assets/sounds/level-passed.mp3");
    successSound.volume = 0.2;
    successSound.play();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    level++; // augmenter le niveau

    playerY = canvas.height - PLAYER_HEIGHT; // réinitialiser la position du joueur
    copY = canvas.height - PLAYER_HEIGHT; // réinitialiser la position du joueur
    drawCopBool = false;

    if (limitRoad <= 8) {
        limitRoad += 2;
    }
    if (level % 2) {
        copSpeed += 1;
    }

    clearInterval(intervaleMoveCop);
    intervaleMoveCop = setInterval(moveCop, 10);

    copSpawnTime = copSpawnTime / 1.1;
    obstacleSpeed += 1; // augmenter la vitesse de l'obstacle
    playerSpeed += 1; // augmenter la vitesse du joueur
    listRoads = [];
    listRoadsReverse = [];
    obstacleList = [];
    genRoad();
    createObstacle();
    sleep(copSpawnTime).then(r => {
        drawCopBool = true;
        let copSpawnSound = new Audio("assets/sounds/cop-spawn.mp3");
        copSpawnSound.volume = 0.2;
        copSpawnSound.play();
    });
}

let gameOver = false;
let requestId;
requestId = requestAnimationFrame(draw);

//draw everything in the game
function draw() {
    if (gameOver) {
        cancelAnimationFrame(requestId);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sideWalkImage, 0, 0, canvas.width, canvas.height);

    drawAllRoad();
    drawPlayer();
    drawScore();
    drawLevel();
    obstacleList.forEach(moveObstacle);
    obstacleList.forEach(drawObstacle);
    if (drawCopBool) {
        drawcop();
    }
}

function createObstacle() {
    let reverse = true;
    for (let i = 0; i < limitObstacle; i++) {
        if (reverse) {
            obstacleList.push(new Obstacle(0, -OBSTACLE_HEIGHT, reverse));
            reverse = false;
        }
        else {
            obstacleList.push(new Obstacle(canvas.width, -OBSTACLE_HEIGHT, reverse));
            reverse = true;
        }
    }
}

let pairFoot = false;
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
        playerY -= playerSpeed; // mise à jour de la position du joueur

        let moveSound;
        if (pairFoot) {
            moveSound = new Audio("assets/sounds/footstep-1.mp3");
            pairFoot = false;
        } else {
            moveSound = new Audio("assets/sounds/footstep-2.mp3");
            pairFoot = true;
        }
        moveSound.volume = 0.2;
        moveSound.play();

        if (playerY + PLAYER_HEIGHT < 0) { // si le joueur atteint la fin de la map
            nextLevel(); // passer au niveau suivant
        }
        // Lancer l'animation de course
        if (playerRunAnimationInterval === null) {
            playerRunAnimationInterval = setInterval(() => {
                playerRunImageIndex = (playerRunImageIndex + 1) % 2;
            }, 200);
        }
    }
});

document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowUp") {
        // Arrêter l'animation de course
        clearInterval(playerRunAnimationInterval);
        playerRunAnimationInterval = null;
        playerRunImageIndex = 0;
    }
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


setInterval(draw, 10);
let intervaleMoveCop = setInterval(moveCop, 10);
nextLevel();
