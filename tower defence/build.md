# 빌드 방법 (코드를 수정했을 때만 필요)

`game.html` 은 `src/` 폴더의 모듈들을 하나로 합친 **결과물**입니다.
`src/` 안의 파일을 수정했다면 아래 명령으로 다시 합쳐야 `game.html` 에 반영됩니다.

## Node.js 가 설치되어 있는 경우

프로젝트 폴더에서 `build.sh` 를 실행하면 됩니다.

```
bash build.sh
```

(내부적으로 `npx esbuild` 로 모듈을 번들링하고, CSS와 함께 `game.html` 로 합칩니다)

## Node.js 없이 수정하고 싶다면

`game.html` 파일을 직접 열어서 수정해도 됩니다.
파일 안에 CSS와 JS가 모두 들어 있고, 원래 파일별 구분은 주석으로 남아 있습니다.

- 밸런스 수치: `CONFIG =` 검색
- 타워 계열: `FAMILIES =` / 전설 조합표: `LEGENDARY_TOWERS =`
- 적 수치: `ENEMIES =` / 미션: `MISSIONS =`

## 브라우저 콘솔 치트 (F12 → Console)

```js
__GAME__.state.gold = 99999;          // 골드
__GAME__.state.life = 999;            // 라이프
__GAME__.CONFIG.wave.hpGrowth = 1.15; // 난이도 낮추기
__GAME__.CONFIG.merge.required = 3;   // 합성 개수 3개로
__GAME__.state.speed = 3;             // 배속 (1/2/3)
__GAME__.state.upgrades = [5,10,15,20,30];  // 전 등급 강화 만렙
__GAME__.api.startMission('elite');   // 미션 강제 시작
__GAME__.api.buyUpgrade(4);           // 전설 강화 1레벨 구매
```
