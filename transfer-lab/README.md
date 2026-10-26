# Transfer Flow Lab

Free static Korean classroom A/B activity. Educational reconstruction inspired by https://toss.tech/article/toss-money-transfer-bank-recommendation ; not affiliated with Toss. No real transfers. Only the fixed fictional task is accepted: 김하늘 / 하늘은행 / 000-1234-5678 / 30,000원. Notices remain outside the phone.

## Run
Open transfer-lab/ on the published site, or run `node transfer-lab/serve.cjs` and open http://127.0.0.1:4382/transfer-lab/ locally. No build, accounts, keys or analytics service.

## Classroom steps
1. Read the task and click **실험 시작하기**.
2. A: **하늘은행 → 계좌번호 입력 → 다음**. B: **계좌번호 입력 → 다음 → 추천 목록의 하늘은행**.
3. Verify recipient and amount, then **보내기**. **송금을 완료했어요** is the completion criterion.
4. Read elapsed time/errors/backtracks outside the phone and click **내 결과 내려받기**. Nothing is automatically sent to an instructor.
5. **현재 실행 끝내기** marks abandonment; the same download button exports it. **연습으로 다시 하기** starts an excluded repeat. **보관된 첫 참여 결과 내려받기** retrieves the first record after practice.
6. After participation expand **수업 진행자 도구 · 실험 후 열어보세요**. **A 흐름 미리보기** / **B 흐름 미리보기** create excluded teacher runs.
7. Use **결과 파일 선택**, or paste one JSON result and click **붙여넣은 결과 추가**. **가져온 결과 비우기** clears only the imported summary.

## Assignment and privacy
Official MIT GrowthBook browser SDK 1.8.0 is vendored locally. A random UUID identifies each run; GrowthBook hashes it against the hard-coded `transfer-flow-v2` experiment with equal weights. Its callback records one local exposure. No remote initialization, Cloud connection, credentials or telemetry. This is SDK allocation and a custom local summary, not the full GrowthBook dashboard.

Session storage is tab-scoped. Reload restores the same run; new tabs start independently. First-run labels are not identity verification. Preview exposure before participation causes later runs in that tab to count as repeats. Closing a tab may lose data; download before closing. Time includes background/reload time and freezes on completion/abandonment; system clock changes can affect it. Invalid account input is never stored or exported.

Exports contain schemaVersion, experimentId, id, assignmentSource, variant, mode, status, elapsedMs, errors, backtracks and events. Events contain type, step, elapsedMs and optional categorical code; no raw account input or personal information. Events cover exposure, progress, validation, backtracking, completion/abandonment and visibility.

## Interpretation
Compare the whole flow bundle, not a single isolated UI element. B changes both order and number of bank choices. Suggestions are fixed fictional fixtures, not ML. Small samples, optional submission, prior exposure and device differences preclude a reliable winner claim. Completed-time summaries exclude unfinished runs, but completion-rate denominators include running/abandoned first runs. Preview/repeat runs are excluded, duplicate IDs ignored. Imports are not identity-verified or tamper-proof evidence.

## Tests
Run `node transfer-lab/test.cjs`: official SDK allocation for 100 synthetic IDs, repeat stability, local exposures and zero network calls; parser fixtures for malformed/schema/experiment/ID/count/time errors, duplicates, exclusions, denominators and medians. Generated evidence goes into ignored evidence/ and is not published. Fixtures are synthetic, never student results.
