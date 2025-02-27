<script setup lang="ts">
import { ref, onUnmounted } from "vue";

// 10x10 のグリッドを初期化
const grid = ref(Array.from({ length: 10 }, () => Array(10).fill("")));

// 行と列の数字（1~9の範囲でランダムに設定）
const rowNumbers = ref(
  Array.from({ length: 10 }, () => Math.floor(Math.random() * 9) + 1)
);
const columnNumbers = ref(
  Array.from({ length: 10 }, () => Math.floor(Math.random() * 9) + 1)
);

// 結果（正誤判定）を格納
const results = ref(Array.from({ length: 10 }, () => Array(10).fill(true)));

// タイマー管理
const startTime = ref<number | null>(null);
const timer = ref<ReturnType<typeof setInterval> | null>(null); // 型を指定
const elapsedTime = ref<string>("");

// ゲーム状態管理
const isStarted = ref(false); // スタート前はマスを非表示

// タイマーを開始
const startCalculation = () => {
  isStarted.value = true; // スタート時にマスを表示
  startTime.value = Date.now();
  elapsedTime.value = "0分0秒";
  grid.value = Array.from({ length: 10 }, () => Array(10).fill(""));

  // タイマーを定期的に更新
  if (timer.value) {
    clearInterval(timer.value);
  }
  timer.value = setInterval(() => {
    if (startTime.value) {
      const now = Date.now();
      const totalSeconds = Math.floor((now - startTime.value) / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      elapsedTime.value = `${minutes}分${seconds}秒`;
    }
  }, 1000);
};

const resetCalculation = () => {
  isStarted.value = false;
  elapsedTime.value = "0分0秒";
  grid.value = Array.from({ length: 10 });
};

// 答え合わせ
const submitCalculation = () => {
  if (!startTime.value) {
    alert("計算を開始してください！");
    return;
  }

  // 正誤判定
  results.value = grid.value.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      const correctAnswer =
        rowNumbers.value[rowIndex] + columnNumbers.value[colIndex];
      return parseInt(cell, 10) === correctAnswer;
    })
  );

  // 正解数をカウント
  const correctCount = results.value
    .flat()
    .filter((isCorrect) => isCorrect).length;

  // タイマーを停止
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }

  alert(
    `計算結果を確認してください！\n正解数: ${correctCount}点\n経過時間: ${elapsedTime.value}`
  );
};

// クリーンアップ（コンポーネントが破棄されたとき）
onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value);
  }
});

// 入力バリデーション（1~9 の範囲に制限）
const validateInput = (row: number, col: number) => {
  let value = grid.value[row][col];
  if (!/^\d{1,3}$/.test(value)) {
    grid.value[row][col] = ""; // 不正な入力をクリア
  }
};

// 入力時に全角を半角に変換
const setInputToHalfWidth = (row: number, col: number) => {
  const inputElement = document.querySelector(
    `input[tabindex="${row * 10 + col}"]`
  ) as HTMLInputElement;
  if (inputElement) {
    inputElement.style.fontFamily = "monospace";
  }
};

// 正誤判定
const isIncorrect = (row: number, col: number) => {
  return !results.value[row][col];
};

// キー操作（矢印キーやBackspaceに対応）
const handleKeydown = (event: KeyboardEvent, row: number, col: number) => {
  const inputElements = document.querySelectorAll("input");
  const index = row * 10 + col;
  switch (event.key) {
    case "ArrowUp":
      if (row > 0) {
        (inputElements[index - 10] as HTMLInputElement).focus();
      }
      break;
    case "ArrowDown":
      if (row < 9) {
        (inputElements[index + 10] as HTMLInputElement).focus();
      }
      break;
    case "ArrowLeft":
      if (col > 0) {
        (inputElements[index - 1] as HTMLInputElement).focus();
      }
      break;
    case "ArrowRight":
      if (col < 9) {
        (inputElements[index + 1] as HTMLInputElement).focus();
      }
      break;
    case "Backspace":
      grid.value[row][col] = "";
      break;
    default:
      break;
  }
};
</script>

<style>
body {
  font-family: Arial, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  background-color: #f9f9f9;
  overflow: hidden;
}
.container {
  text-align: center;
  overflow: auto; /* コンテンツが溢れた場合にスクロール可能にする */
  max-height: 100vh;
  padding-bottom: 70px;
}
table {
  border-collapse: collapse;
  margin: 20px auto;
}
th,
td {
  width: 40px;
  height: 40px;
  text-align: center;
  vertical-align: middle;
  border: 1px solid #ccc;
}
.header-cell {
  font-size: 16px;
  font-family: Arial, sans-serif;
}
.cell {
  position: relative;
}
input {
  width: 100%;
  height: 100%;
  text-align: center;
  border: none;
  font-size: 20px;
  box-sizing: border-box;
  caret-color: transparent;
}
input:focus {
  outline: 2px solid #4caf50;
}
input.incorrect {
  outline: none;
}
.error-mark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: red;
  font-size: 12px;
  pointer-events: none;
}
.button {
  margin-top: 10px;
}
button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  background-color: #4caf50;
  color: white;
  border-radius: 5px;
  margin-right: 20px;
}
button:hover {
  background-color: #45a049;
}
</style>

<template>
  <div class="container">
    <h1>100マス計算</h1>
    <b>足し算</b>
    <div class="button" v-if="!isStarted">
      <button @click="startCalculation">スタート</button>
    </div>
    <div v-if="isStarted" class="status-bar">
      <p>時間経過: {{ elapsedTime }}</p>
      <button @click="resetCalculation">最初からやり直す</button>
      <button @click="submitCalculation">答え合わせ</button>
    </div>
    <div v-if="isStarted">
      <table>
        <thead>
          <tr>
            <th>+</th>
            <!-- 左上に "+" を追加 -->
            <th v-for="col in 10" :key="col">{{ columnNumbers[col - 1] }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in 10" :key="row">
            <td class="header-cell">{{ rowNumbers[row - 1] }}</td>
            <td v-for="col in 10" :key="col" class="cell">
              <input
                type="text"
                maxlength="3"
                v-model="grid[row - 1][col - 1]"
                :class="{ incorrect: isIncorrect(row - 1, col - 1) }"
                tabindex="0"
                inputmode="numeric"
                @focus="setInputToHalfWidth(row - 1, col - 1)"
                @keydown="handleKeydown($event, row - 1, col - 1)"
                @input="validateInput(row - 1, col - 1)"
              />
              <span v-if="isIncorrect(row - 1, col - 1)" class="error-mark"
                >✖</span
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
