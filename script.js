document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".grid");
  const scoreDisplay = document.querySelector("#score");
  const resetBtn = document.getElementById("reset-btn");
  const containerGame = document.querySelector(".container");
  const brickSound = document.getElementById("brickSound");
  const playerName = document.getElementById("player-name");

  const blockWidth = 100;
  const blockHeight = 20;
  const ballDiameter = 25;
  const boardWidth = 900;
  const boardHeight = 700;
  const paddleWidth = 140; // Define the paddle width

  // Calculate block spacing dynamically or set it manually
  const cols = 8; // Fixed number of columns
  const blockSpacingX = (boardWidth - cols * blockWidth) / (cols + 1); // Spacing between blocks, including left and right margins
  const blockSpacingY = 10; // Vertical spacing between rows

  let xDirection = -2;
  let yDirection = 2;
  let paddleHitCount = 0;
  const maxSpeed = 10;

  //audio
  brickSound.load();

  // Update the initial position of the user (paddle) and the ball
  const userStart = [400, 30]; // Paddle closer to the bottom
  let currentPosition = userStart;

  const ballStart = [450, 60]; // Ball slightly above the paddle
  let ballCurrentPosition = ballStart;

  let timerId;
  let score = 0;

  // Adjust block positions
  class Block {
    constructor(xAxis, yAxis) {
      this.bottomLeft = [xAxis, yAxis];
      this.bottomRight = [xAxis + blockWidth, yAxis];
      this.topRight = [xAxis + blockWidth, yAxis + blockHeight];
      this.topLeft = [xAxis, yAxis + blockHeight];
    }
  }

  document.getElementById("btn-donate").addEventListener("click", function () {
    const difficulty = document.getElementById("difficulty").value;

    //check for input value
    if (playerName.value.length < 1) {
      alert("Please enter your name");
      document.querySelector(".game-setup").style.display = "block";
      containerGame.style.display = "none";
    } else {
      let rows;

      switch (difficulty) {
        case "Normal":
          rows = 3;
          break;
        case "Hard":
          rows = 5;
          break;
        case "Very Hard":
          rows = 7;
          break;
        default:
          rows = 3;
      }

      // Now you can use `playerName` and `rows` to start the game
      // scoreDisplay.innerHTML = `Player Name: ${playerName}, Difficulty: ${difficulty}`;

      // Hide the game setup UI
      document.querySelector(".game-setup").style.display = "none";
      containerGame.style.display = "flex";
      scoreDisplay.innerHTML = `${playerName.value} :`;

      // Start the game with the selected difficulty
      startGame(rows);
    }
  });

  function startGame(rows) {
    // Dynamically position blocks based on the block size and spacing
    const blocks = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * (blockWidth + blockSpacingX) + blockSpacingX;
        const y =
          boardHeight -
          (row + 1) * (blockHeight + blockSpacingY) -
          blockSpacingY;
        blocks.push(new Block(x, y));
      }
    }

    // Draw the blocks
    function addBlocks() {
      for (let i = 0; i < blocks.length; i++) {
        const block = document.createElement("div");
        block.classList.add("block");
        block.style.left = blocks[i].bottomLeft[0] + "px";
        block.style.bottom = blocks[i].bottomLeft[1] + "px";
        grid.appendChild(block);

        let hueColor = Math.floor(Math.random() * 360); // Hue ranges from 0 to 360
        let color = `hsl(${hueColor}, 100%, 50%)`; // Full saturation and 50% lightness for vibrant colors
        block.style.background = color;
      }
    }
    addBlocks();

    // Add the user (paddle)
    const user = document.createElement("div");
    user.classList.add("user");
    user.style.width = paddleWidth + "px"; // Set the width of the paddle
    grid.appendChild(user);
    drawUser();

    // Add the ball
    const ball = document.createElement("div");
    ball.classList.add("ball");
    let hueColor = Math.floor(Math.random() * 360); // Hue ranges from 0 to 360
    let color = `hsl(${hueColor}, 100%, 50%)`; // Full saturation and 50% lightness for vibrant colors
    ball.style.background = color;
    grid.appendChild(ball);
    drawBall();

    // Move the user (paddle)
    function moveUser(e) {
      if (
        (e.code === "ArrowLeft" && currentPosition[0] > 0) ||
        (e.code === "KeyA" && currentPosition[0] > 0)
      ) {
        currentPosition[0] -= 20;
        drawUser();
      } else if (
        (e.code === "ArrowRight" &&
          currentPosition[0] < boardWidth - paddleWidth) ||
        (e.code === "KeyD" && currentPosition[0] < boardWidth - paddleWidth)
      ) {
        currentPosition[0] += 20;
        drawUser();
      }
    }
    document.addEventListener("keydown", moveUser);

    // Draw the user (paddle)
    function drawUser() {
      user.style.left = currentPosition[0] + "px";
      user.style.bottom = currentPosition[1] + "px";
    }

    // Draw the ball
    function drawBall() {
      ball.style.left = ballCurrentPosition[0] + "px";
      ball.style.bottom = ballCurrentPosition[1] + "px";
    }

    // Move the ball
    function moveBall() {
      ballCurrentPosition[0] += xDirection;
      ballCurrentPosition[1] += yDirection;
      drawBall();
      checkForCollisions();
    }
    timerId = setInterval(moveBall, 15);

    // Check for collisions
    function checkForCollisions() {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const ballLeft = ballCurrentPosition[0];
        const ballRight = ballCurrentPosition[0] + ballDiameter;
        const ballTop = ballCurrentPosition[1] + ballDiameter;
        const ballBottom = ballCurrentPosition[1];

        // Define the block's edges
        const blockLeft = block.bottomLeft[0];
        const blockRight = block.bottomRight[0];
        const blockTop = block.topLeft[1];
        const blockBottom = block.bottomLeft[1];

        // Check if the ball is within the horizontal and vertical bounds of the block
        const isWithinXBounds = ballRight > blockLeft && ballLeft < blockRight;
        const isWithinYBounds = ballTop > blockBottom && ballBottom < blockTop;

        if (isWithinXBounds && isWithinYBounds) {
          const allBlocks = Array.from(document.querySelectorAll(".block"));
          allBlocks[i].classList.remove("block");
          blocks.splice(i, 1);
          score++;
          scoreDisplay.innerHTML = `${playerName.value} : ${score}`;
          brickSound.currentTime = 0;
          brickSound.play();

          // Determine which side of the block the ball hit and adjust the direction accordingly
          if (
            ballBottom <= blockTop && // Ball is moving upward and hits the bottom edge of the block
            ballBottom >= blockBottom
          ) {
            yDirection = -yDirection; // Reverse vertical direction
          } else if (
            ballTop >= blockBottom && // Ball is moving downward and hits the top edge of the block
            ballTop <= blockTop
          ) {
            yDirection = -yDirection; // Reverse vertical direction
          } else if (
            ballRight >= blockLeft && // Ball is moving leftward and hits the right edge of the block
            ballLeft <= blockRight
          ) {
            xDirection = -xDirection; // Reverse horizontal direction
          } else if (
            ballLeft <= blockRight && // Ball is moving rightward and hits the left edge of the block
            ballRight >= blockLeft
          ) {
            xDirection = -xDirection; // Reverse horizontal direction
          }

          if (blocks.length == 0) {
            scoreDisplay.innerHTML = "You Win !";
            clearInterval(timerId);
            document.removeEventListener("keydown", moveUser);
          }
          break;
        }
      }

      if (
        ballCurrentPosition[0] + ballDiameter > boardWidth || // Right wall
        ballCurrentPosition[0] < 0 // Left wall
      ) {
        xDirection = -xDirection;
      }

      // Top wall
      if (ballCurrentPosition[1] + ballDiameter > boardHeight) {
        yDirection = -yDirection;
      }

      if (
        ballCurrentPosition[0] + ballDiameter > currentPosition[0] && // Ball's right edge is past the paddle's left edge
        ballCurrentPosition[0] < currentPosition[0] + paddleWidth && // Ball's left edge is before the paddle's right edge
        ballCurrentPosition[1] <= currentPosition[1] + blockHeight // Ball's bottom edge is hitting the paddle's top edge
      ) {
        // Determine where on the paddle the ball hits
        const paddleCenter = currentPosition[0] + paddleWidth / 2;
        const ballCenter = ballCurrentPosition[0] + ballDiameter / 2;

        // Change the xDirection based on the hit location
        if (ballCenter < paddleCenter) {
          // Ball hits the left side of the paddle
          xDirection = Math.abs(xDirection) * -1;
        } else if (ballCenter > paddleCenter) {
          // Ball hits the right side of the paddle
          xDirection = Math.abs(xDirection);
        }

        changeDirection();
        paddleHitCount++;

        if (paddleHitCount % 5 === 0) {
          increaseBallSpeed();
        }
      }

      // Game over
      if (ballCurrentPosition[1] <= 0) {
        clearInterval(timerId);
        scoreDisplay.innerHTML = "You Lose !";
        document.removeEventListener("keydown", moveUser);
      }
    }

    function changeDirection() {
      yDirection = -yDirection;
    }

    function increaseBallSpeed() {
      if (Math.abs(xDirection) < maxSpeed) {
        if (xDirection > 0) {
          xDirection += 1;
        } else {
          xDirection -= 1;
        }
      }

      if (Math.abs(yDirection) < maxSpeed) {
        if (yDirection > 0) {
          yDirection += 1;
        } else {
          yDirection -= 1;
        }
      }
    }

    resetBtn.addEventListener("click", () => {
      window.location.reload();
    });

    document.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        window.location.reload();
      }
    });
  }
});
