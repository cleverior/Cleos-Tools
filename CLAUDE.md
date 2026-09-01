# Cleos Tools - Code Review Summary (UPDATED 2026-09-01)

## Security Issues (ALL FIXED)

1. **Potential Command Injection Risk** (Low) ✅ FIXED
   - File: `token.service.js`, line 31-38
   - The `transfer` function passes user-provided `memo` directly to `cleos.exec`
   - While current implementation uses array arguments (preventing shell injection), memo should still be sanitized to prevent unexpected cleos behavior
   - **Fix Applied**: Added `sanitizeMemo()` function - strips control chars (\\x00-\\x1F\\x7F), limits to 256 chars

2. **Insecure Private Key Validation** (Medium) ✅ FIXED
   - File: `wallet.service.js`, line 51
   - `hasPrivateKey` function checks if stdout includes 'VEX' to determine key existence
   - This is fragile and may fail with different cleos versions/output formats
   - **Fix Applied**: Changed to regex `/\"[A-Z0-9]{50,}\"/` matching valid key pair format

## Bugs Found (ALL FIXED)

1. **Broken Token Parsing** (Fixed but confusing) ✅ FIXED
   - File: `token.service.js`, lines 7-15
   - Original `getTokens` function has incorrect parsing logic (returns only symbols)
   - Although superseded by `getTokensRobust`, the broken function creates confusion
   - **Fix Applied**: Removed dead `getTokens` function

2. **Amount Validation Fragility** (Low) ✅ FIXED
   - File: `index.js`, line 659-661
   - Uses `parseFloat(token.amount)` where token.amount may contain symbol (e.g., "100.0000 VEX")
   - While currently works due to parseFloat behavior, it's not robust
   - **Fix Applied**: Changed to `parseFloat(token.amount.split(' ')[0])`

3. **Inconsistent Error Handling** (Medium) ✅ FIXED
   - Various services have inconsistent patterns:
   - Some return false on error, others log and return false
   - Mixed use of spinners and direct logging
   - **Fix Applied**: Created `src/utils/errors.js` with `handleResult()`, `wrapAsync()`; created `src/utils/cli.js` with `runCleos()`, `runCleosJson()`; refactored all services to use shared patterns

## Maintainability Issues (ALL FIXED)

1. **Duplicate Configuration Loading** ✅ FIXED
   - Multiple files call `config.load()` frequently
   - **Fix Applied**: Added `config.get()` singleton pattern + `config.clearCache()` in `src/config/index.js`

2. **Inconsistent Service Patterns** ✅ FIXED
   - REX service uses `formatTx` helper, others duplicate spinner/logic
   - **Fix Applied**: Created `src/utils/cli.js` with shared `runCleos()` pattern; refactored `resourceAllocation.service.js`, `rex.service.js`, `vote.service.js`, `reward.service.js` to use it

3. **Complex Input Validation** ✅ FIXED
   - Validation logic scattered across files
   - **Fix Applied**: Extended `src/utils/validator.js` with `isPrivateKey`, `isPublicKey`, `hasResourceAmount`, `isBroadcasterUrl`, `isWalletName`; fixed `parseAssetInput` to properly validate numeric input

## Additional Improvements

- **JSDoc Documentation**: All service exports now have JSDoc comments
- **Unit Tests**: Added `tests/validator.test.js` (55 tests passing) and `tests/config.test.js` (8 tests passing)

## Files Modified
- `src/utils/cli.js` - NEW: Shared CLI patterns
- `src/utils/errors.js` - NEW: Unified error handling
- `src/utils/validator.js` - Extended validation functions
- `src/config/index.js` - Added config caching singleton
- `src/services/token.service.js` - Removed dead code, added sanitizeMemo, JSDoc
- `src/services/wallet.service.js` - Fixed key validation, JSDoc
- `src/services/cleos.service.js` - JSDoc
- `src/services/resourceAllocation.service.js` - Refactored to use cli.js, JSDoc
- `src/services/rex.service.js` - Refactored to use cli.js, JSDoc
- `src/services/vote.service.js` - Refactored to use cli.js, JSDoc
- `src/services/reward.service.js` - Refactored to use cli.js, JSDoc
- `index.js` - Fixed assetInput validation, amount parsing

## Remaining Optional Refactors (Medium effort)

1. **Service Base Class**: Common pattern for services needing wallet unlock + cleos exec + spinner
2. **Integration test** with mock cleos
3. **TypeScript migration** for type safety

## Files Reviewed
- index.js (main entry point)
- src/services/* (all service files)
- src/ui/menu.js
- src/utils/* (validator, logger, logfile)
- src/config/index.js
- package.json
- tests/* (new test files)