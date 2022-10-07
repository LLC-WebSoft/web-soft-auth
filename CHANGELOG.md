# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- ## [Unreleased] -->

### Added

- Sanitizer class to prevent an XSS attack using an xss package.
- A global instance of Sanitizer class.
- Limit on the size of the request body.
- MAX_PAYLOAD_SIZE_EXCEEDED and BODY_RECIEVE_ERROR error codes.
- The ability to set a list of allowed sources for requests.

### Removed

- The authentication module is extracted into its own package.

## [2.0.2] - 2022-09-11

### Added

- Integration tests for Auth module.

### Changed

- Fix bug when Auth.login method crashed when no user found in database.
- Fix bug when user could change password for every another user with Auth.changePassword method.
- Set minimum username length to 2 and minimum password length to 8 in Auth module.
- Split tests into Unit and Integration tests.

## [2.0.1] - 2022-09-08

### Changed

- Fix bug when SessionService.restoreSession method pass empty token to database.
- Fix bug when Auth.register method incorrectly pass username instead of user object to startSession method.
- Fix bug when server shutdown after error on WebSocket connection initialise method.
- Token field type in Session table in database schema.

## [2.0.0] - 2022-08-20

### Added

- Server 'start' method.
- Default config to server module.
- HttpConnection and WsConnection factory classes.
- 'use strict' directive.
- Documentation in russian.
- Secure HTTP protocol is now supported.
- CHANGELOG.md.
- Introspection getErrors method.
- Function registerError for adding new error types for api.

### Changed

- Function getIntrospectionModule return object with 'introspection' property.
- Class ConsoleTransport not a singlton.
- HTTPConnection fix bug when global HEADERS object was modifing.

## [1.0.2] - 2022-03-14

### Added

- Unit tests.

### Changed

- Fix bug when reading property of undefined in client.checkConnection.

## [1.0.1] - 2022-03-11

### Changed

- Descriptions for Auth module schema.

## [1.0.0] - 2022-03-11

### Added

- Initial project structure.
- User module.
- Session module.
- Security utils.
- Auth module.
- Database module.
- Server module.
- Validator service.
- HTTP and WebSocket transport.
- Logger service.
- Introspection module.

[unreleased]: https://github.com/web-soft-llc/web-soft-server/compare/v2.0.2...master
[2.0.2]: https://github.com/web-soft-llc/web-soft-server/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/web-soft-llc/web-soft-server/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/web-soft-llc/web-soft-server/compare/v.1.0.2...v2.0.0
[1.0.2]: https://github.com/web-soft-llc/web-soft-server/compare/v.1.0.1...v.1.0.2
[1.0.1]: https://github.com/web-soft-llc/web-soft-server/compare/v.1.0.0...v.1.0.1
[1.0.0]: https://github.com/web-soft-llc/web-soft-server/releases/tag/v.1.0.0
