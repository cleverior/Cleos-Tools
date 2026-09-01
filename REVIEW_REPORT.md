# Cleos Tools - Code Review Report

**Date**: 2026-09-01  
**Branch**: main  
**Review Type**: Security, Bugs, Maintainability

---

## Executive Summary

Cleos Tools is a well-structured CLI for Vexanium BP wallet management. The codebase follows good patterns (modular services, config-driven, interactive UI). No critical security vulnerabilities found. Several medium/low issues identified for improvement.

---

## Security Findings (ALL FIXED)

| Severity | Issue | File | Line | Description |
|----------|-------|------|------|-------------|
| **Low** | Command Injection Surface | `token.service.js` | 31-38 | User-provided `memo` passed to cleos without sanitization. Array args prevent shell injection, but memo could trigger cleos parsing edge cases. |
| **Medium** | Fragile Key Validation | `wallet.service.js` | 51 | `hasPrivateKey` checks stdout for "VEX" string. May break with cleos version changes or different key types. |

**Fix Applied**:
- Added `sanitizeMemo()` function in `token.service.js` - strips control chars, limits to 256 chars
- Changed `wallet.service.js` to regex `/\"[A-Z0-9]{50,}\"/` matching valid key pair format

---

## Bugs Found (ALL FIXED)

| Severity | Issue | File | Line | Description |
|----------|-------|------|------|-------------|
| **Low** | Dead Code | `token.service.js` | 7-15 | Original `getTokens` function broken (returns only symbols). Superseded by robust version but left in code. |
| **Low** | Fragile Amount Parse | `index.js` | 659-661 | `parseFloat(token.amount)` where `token.amount` = "100.0000 VEX". Works due to JS parseFloat behavior but not explicit. |
| **Medium** | Inconsistent Error Patterns | Multiple | - | Services mix: return false, log.error + return false, throw. No unified error handling. |

**Fix Applied**:
- Removed dead `getTokens` function
- Changed to `parseFloat(token.amount.split(' ')[0])`
- Created `src/utils/errors.js` with `handleResult()`, `wrapAsync()`; created `src/utils/cli.js` with `runCleos()`, `runCleosJson()`; refactored all services

---

## Maintainability Issues (ALL FIXED)

| Issue | Impact | Files Affected |
|-------|--------|----------------|
| Duplicate config loads | Performance (minor) | All services call `config.load()` independently |
| Inconsistent service patterns | Code duplication | REX has `formatTx`; vote/reward/resource duplicate spinner logic |
| Scattered validation | Inconsistent rules | `validator.js` + inline validation in `index.js` |
| No JSDoc | Onboarding friction | All service files lack function documentation |

**Fix Applied**:
- Added `config.get()` singleton + `config.clearCache()`
- Created `src/utils/cli.js` with shared `runCleos()` pattern; refactored services
- Extended `validator.js` with `isPrivateKey`, `isPublicKey`, `hasResourceAmount`, `isBroadcasterUrl`, `isWalletName`; fixed `parseAssetInput`
- Added JSDoc to all service exports

---

## Positive Observations

✅ Good separation of concerns (services/UI/utils/config)  
✅ Uses `spawnSync` with array args (prevents shell injection)  
✅ Auto-detects wallet status, passwords, voted BPs  
✅ Health checks before critical operations  
✅ Persistent config with sensible defaults  
✅ Activity logging for audit trail  
✅ ESC key handling in prompts  
✅ Color-coded, user-friendly output  

---

## Quick Wins (Can fix in < 1 hour each) - ALL DONE

1. ✅ **Remove dead `getTokens` function** - `token.service.js` lines 7-15
2. ✅ **Fix amount parsing** - `index.js` line 659
3. ✅ **Add memo sanitization** - `token.service.js` before line 34
4. ✅ **Extract common spinner/error pattern** - Create `utils/cli.js` with `runCleos(cmd, args, opts)`
5. ✅ **Add JSDoc to service exports** - All `module.exports` in services
6. ✅ **Unified Error Handling** - Create `utils/errors.js` with standardized result handling
7. ✅ **Config Caching** - Add `config.get()` singleton or pass config object to services
8. ✅ **Input Validation Centralization** - Move all validation rules to `validator.js`
9. ✅ **Add unit tests** for validator and config modules

---

## Suggested Refactors (Medium effort - Optional)

1. **Service Base Class**: Common pattern for services needing wallet unlock + cleos exec + spinner
2. **Integration test** with mock cleos
3. **TypeScript migration** for type safety

---

## Files Modified in This Review

- `src/utils/cli.js` - NEW: Shared CLI patterns (`runCleos`, `runCleosJson`)
- `src/utils/errors.js` - NEW: Unified error handling (`handleResult`, `wrapAsync`)
- `src/utils/validator.js` - Extended validation functions
- `src/config/index.js` - Added config caching singleton (`get`, `clearCache`)
- `src/services/token.service.js` - Removed dead code, added `sanitizeMemo`, JSDoc
- `src/services/wallet.service.js` - Fixed key validation, JSDoc
- `src/services/cleos.service.js` - JSDoc
- `src/services/resourceAllocation.service.js` - Refactored to use cli.js, JSDoc
- `src/services/rex.service.js` - Refactored to use cli.js, JSDoc
- `src/services/vote.service.js` - Refactored to use cli.js, JSDoc
- `src/services/reward.service.js` - Refactored to use cli.js, JSDoc
- `index.js` - Fixed `assetInput` validation, amount parsing
- `tests/validator.test.js` - NEW: 55 tests passing
- `tests/config.test.js` - NEW: 8 tests passing

---

## Applied Fixes (Quick Wins)

✅ **Removed dead `getTokens` function** - `token.service.js` lines 7-15  
✅ **Fixed amount parsing** - `index.js` line 659, now uses `parseFloat(token.amount.split(' ')[0])`  
✅ **Added memo sanitization** - `token.service.js` new `sanitizeMemo()` function, strips control chars, limits to 256 chars  
✅ **Improved key validation** - `wallet.service.js` line 51, regex `/\"[A-Z0-9]{50,}\"/` matches valid key format  
✅ **Extracted common spinner/error pattern** - Created `src/utils/cli.js` with `runCleos()` and `runCleosJson()`  
✅ **Added JSDoc to service exports** - All `module.exports` in services now documented  
✅ **Unified Error Handling** - Created `src/utils/errors.js` with `handleResult()`, `wrapAsync()`  
✅ **Config Caching** - Added `config.get()` singleton + `config.clearCache()`  
✅ **Input Validation Centralization** - Extended `validator.js` with comprehensive validation  
✅ **Added unit tests** - `tests/validator.test.js` (55 passed), `tests/config.test.js` (8 passed)