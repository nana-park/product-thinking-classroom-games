# Transfer Flow Lab — mobile classroom edition

Static educational reconstruction inspired by https://toss.tech/article/toss-money-transfer-bank-recommendation . Not affiliated with Toss. No real transfers or real financial accounts. Optional PostHog collection uses only a public write-only token.

## Preview
Run `node transfer-lab/serve.cjs`. Student: http://127.0.0.1:4382/transfer-lab/ . Instructor: http://127.0.0.1:4382/transfer-lab/facilitator.html . Public path remains /transfer-lab/; mobile classroom edition.

## Lesson instructions
Intro: A/B 테스트 체험하기 → 다음. Shared app landing: 송금하기. Assignment, exposure and timing begin only at 송금하기 in both conditions. Supply the task in the lecture: 김하늘 / 하늘은행 / 000-1234-5678 / 30,000원.
A: choose 하늘은행 → enter account → 다음. B: enter account → 다음 → choose 하늘은행. Both: enter 30000 → 다음 → confirm details → 보내기 → 송금을 완료했어요 → 내 결과 내려받기.
나가기 opens 계속하기 / 그만하기. Voluntary exit also offers 내 결과 내려받기. 처음으로 returns to intro; subsequent runs in the tab are excluded repeats. Download before restarting or closing.
The task has no surrounding instructions, phone frame, teacher controls, analytics or variant labels. Essential educational/no-real-transfer notice is on intro only, outside the banking UI.

## Instructor
facilitator.html has A 흐름 미리보기, B 흐름 미리보기, 결과 파일 선택, 붙여넣은 결과 추가 and 가져온 결과 비우기. Paste one result object at a time. Preview routes index.html?preview=A / B use separate session storage and always export teacher_preview, excluded from comparisons. No student-facing link exposes these controls; this is exercise separation, not access control.

## Data
Official local MIT GrowthBook SDK 1.8.0 allocates random run UUIDs equally in transfer-flow-v2. No cloud connection or telemetry; SDK allocation plus custom local summary is not the full GrowthBook dashboard. SchemaVersion1 remains compatible; mobile exports add layoutVersion: mobile-v2-amount. The importer labels unversioned old exports legacy and rejects mixed-layout batches until the summary is cleared. Do not pool results from the previous surrounding-instructions design with this mobile redesign, because task context changed.
Reload restores the same run/assignment with one exposure; new tabs are independent. First-run status is per tab, not identity verification. Wall time includes background/reload time and freezes at completion/abandonment. Raw account or amount input is never stored. Only amount_valid or empty_amount/incorrect_amount events are exported. The v2 session keys prevent restoring a pre-amount run into this flow. Only the fixed fictional account passes.
The whole sequence/choice-count bundle changes, not one isolated element. Small classroom samples and voluntary submissions do not establish a reliable winner. Preview/repeat records are excluded, duplicate IDs ignored. Time summaries include completed runs; completion denominators also include unfinished first runs.

## Verification
node transfer-lab/test-amount.cjs verifies both amount flows, validation, back/restart, export and version separation using the actual app handlers and synthetic DOM/clock fixtures.
node transfer-lab/test.cjs verifies 100 stable assignments, local callbacks and zero network calls; parser malformed/schema/experiment/ID/count/time/oversize/duplicate/exclusion/summary cases. Generated evidence is ignored and must not be published. UI checks use 390x844 portrait and 390x420 keyboard-height emulation. Physical keyboard/notch behavior still needs real-device testing.

## Instructor-only fixed demonstration
Open facilitator.html?demo=1 to show 15 synthetic records immediately (A 8, B 7). The instructor explains the synthetic origin. The results-only page hides import/preview controls and reloads the same fixed examples. Four zero-based charts show completion rate, completed-run median time, and errors/backtracks per participant with total counts. Normal facilitator.html still starts empty. Demo records have synthetic:true and the ordinary importer rejects them; no samples are merged into real imports. This example is not statistical evidence.

## Optional PostHog collection
After Next, choose 동의하고 체험하기 or 전송 없이 체험하기. Consented minimal events go to PostHog US with one-year retention. Declining retains the same task and JSON export with no SDK load or external requests. No Supabase connection. GrowthBook remains the allocator.

Official vendored posthog-js 1.438.23 no-external module loads after consent only. Autocapture, pageviews, pageleave, replay, profiles, surveys, feature flags and external dependencies are disabled. before_send removes automatic properties. Project Discard client IP data is ON and GeoIP is disabled. Provider network processing still receives IP. No names, emails, raw input, URLs or device metadata are sent.

Events: transfer_exposure, transfer_step_view, transfer_amount_valid, transfer_completion, transfer_abandonment, transfer_error, transfer_backtrack. elapsed_ms is milliseconds. Stable insert ID is run_id + local event sequence. SDK retry is best effort; closing, offline or blockers may lose delivery. Keep JSON as fallback. JSON schema remains unchanged.

Class links can use ?classroom=day7&session=20261027 (ASCII letters/digits/underscore/hyphen, max64). QA adds &synthetic=1. Compare only collection_version=posthog-direct-v1, synthetic=false, mode=first_run, same classroom/session/layout. Count distinct run_id; completed-time summaries use completion events only. Tabs are independent, not verified unique students. Do not mix preview/repeat or the older synthetic feature-flag experiment.

Teacher: https://us.posthog.com/project/688641/activity/events (authorized PostHog login). Static facilitator remains manual/local or fixed demonstration, not live. Small samples and voluntary collection do not prove a winner.
