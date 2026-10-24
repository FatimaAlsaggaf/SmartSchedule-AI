# SmartSchedule Flutter client

A companion client with student, faculty, and committee screens, schedule viewing, and comments. The primary project overview is in the [root README](../README.md).

## Setup

1. Install Flutter with a Dart version compatible with `^3.10.0` in `pubspec.yaml`.
2. Start the configured Express backend as described in the root README.
3. Run `flutter pub get`, then `flutter run` from this directory.

The API base URL in `lib/api/schedule_service.dart` is `http://10.0.2.2:4000`, which targets the host computer from the Android emulator. Adjust it for a physical device or other target. This client has not been built or tested as part of preparing the public repository.
