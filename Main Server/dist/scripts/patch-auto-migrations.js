"use strict";
/**
 * Patches sequelize-auto-migrations for Sequelize v6+ compatibility.
 * 1. Sequelize v6 renamed Model.attributes → Model.rawAttributes.
 * 2. ARRAY types emit invalid SQL syntax (VARCHAR(255)[]) instead of Sequelize.ARRAY(Sequelize.STRING).
 * 3. Array defaultValue emits Sequelize.Array instead of the actual array literal.
 */
const fs = require('fs');
const path = require('path');
const target = path.join(__dirname, '..', 'node_modules', 'sequelize-auto-migrations', 'lib', 'migrate.js');
if (!fs.existsSync(target))
    return;
let content = fs.readFileSync(target, 'utf8');
const hadCRLF = content.includes('\r\n');
if (hadCRLF) {
    content = content.replace(/\r\n/g, '\n');
}
let patched = false;
// Patch 1: rawAttributes compatibility (Sequelize v6)
const rawNeedle = 'let attributes = models[model].attributes;';
const rawReplacement = 'let attributes = models[model].rawAttributes || models[model].attributes;';
if (content.includes(rawNeedle)) {
    content = content.replace(rawNeedle, rawReplacement);
    patched = true;
    console.log('[postinstall] Patched rawAttributes compatibility.');
}
// Patch 2: ARRAY/RANGE type — emit Sequelize.ARRAY(Sequelize.<inner>) instead of SQL syntax
const arrayNeedle = `case DataTypes.ARRAY.key:
        case DataTypes.RANGE.key:
            console.warn(attrName + ' type not supported, you should make it by')
            return prefix + attrObj.toSql()`;
const arrayReplacement = `case DataTypes.ARRAY.key: {
            const innerType = options.type
                ? reverseSequelizeColType({ type: options.type }, prefix)
                : prefix + 'TEXT';
            return prefix + 'ARRAY(' + innerType + ')';
        }
        case DataTypes.RANGE.key:
            console.warn(attrName + ' type not supported, you should make it by')
            return prefix + attrObj.toSql()`;
if (content.includes(arrayNeedle)) {
    content = content.replace(arrayNeedle, arrayReplacement);
    patched = true;
    console.log('[postinstall] Patched ARRAY type generation.');
}
// Patch 3: Array defaultValue — emit actual array literal instead of Sequelize.Array
// Match with flexible whitespace
const defaultRegex = /const reverseSequelizeDefValueType = function\(defaultValue, prefix = 'Sequelize\.'\)\s*\{\s*if \(typeof defaultValue === 'object'\) \{\s*if \(defaultValue\.constructor && defaultValue\.constructor\.name\) \{\s*return \{ internal: true, value: prefix \+ defaultValue\.constructor\.name \};\s*\}\s*\}\s*if \(typeof defaultValue === 'function'\)\s*return \{ notSupported: true, value: '' \};\s*return \{ value: defaultValue \};\s*\};/;
const defaultReplacement = `const reverseSequelizeDefValueType = function(defaultValue, prefix = 'Sequelize.')
{
    if (Array.isArray(defaultValue)) {
        return { value: defaultValue };
    }

    if (typeof defaultValue === 'object' && defaultValue !== null) {
        if (defaultValue.constructor && defaultValue.constructor.name) {
            return { internal: true, value: prefix + defaultValue.constructor.name };
        }
    }

    if (typeof defaultValue === 'function')
        return { notSupported: true, value: '' };

    return { value: defaultValue };
};`;
if (defaultRegex.test(content)) {
    content = content.replace(defaultRegex, defaultReplacement);
    patched = true;
    console.log('[postinstall] Patched array defaultValue generation.');
}
if (patched) {
    if (hadCRLF) {
        content = content.replace(/\n/g, '\r\n');
    }
    fs.writeFileSync(target, content, 'utf8');
}
//# sourceMappingURL=patch-auto-migrations.js.map