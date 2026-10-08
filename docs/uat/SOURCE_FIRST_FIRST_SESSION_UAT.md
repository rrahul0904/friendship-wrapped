# ThreadTales source-first first-session UAT

Use this only on a deployed Preview built from the exact PR head. The primary test route is `/create`; `/rebuild` is retained only as a compatibility/review alias.

Test with five people who did not build the product and have not seen the implementation walkthrough.

## Moderator rule

Do not teach the interface. Give the participant only this task:

> Use this product to turn one chat into something you might send back to the person or group in that chat.

A synthetic/demo chat may be used if the participant does not want to use personal data.

## Observe without prompting

Record:
- whether they understand what file to choose;
- whether they trust the “Processed on this device” explanation;
- whether the short processing interlude feels intentional rather than like a delay;
- whether they reach the first 9:16 reveal without help;
- whether tap/swipe/navigation is discovered naturally;
- any chapter they skip quickly;
- any claim they interpret as psychology rather than a measured pattern;
- whether Share/Save is discovered naturally;
- which chapter, if any, they would send;
- whether the final poster feels like a keepsake or an analytics result;
- total completion time and abandonment point.

## Real-device share check

On the exact same Preview head:
1. Use at least one iPhone-class device and invoke **Share** on a chapter.
2. Confirm the native share sheet receives the 1080×1920 PNG keepsake, not raw chat content.
3. Save/share the final closing keepsake and visually inspect the resulting image.
4. Exercise one non-iOS or fallback path and confirm it remains usable.
5. Record device/browser and any failure; do not count a mocked browser-share test as this real-device gate.

## Exit questions

1. In one sentence, what did this product do for you?
2. Which reveal felt most personal or memorable?
3. Was there anything you would actually send to the other person/group?
4. Did any result feel creepy, judgmental, or unsupported?
5. Did you believe your raw messages stayed on your device? Why or why not?
6. What would you remove?
7. What was missing from the final keepsake?

## Release gate

Promotion requires:
- at least 4/5 complete without instruction;
- at least 4/5 identify a reveal they would genuinely share;
- zero participant reports of an unsupported psychological claim presented as fact;
- real-device PNG sharing confirmed on at least one iPhone-class device plus a fallback/non-iOS path;
- no critical mobile navigation/export failure;
- source-first product owner review of the exact deployed head.

CI, browser mocks, or a READY deployment cannot substitute for this gate.
