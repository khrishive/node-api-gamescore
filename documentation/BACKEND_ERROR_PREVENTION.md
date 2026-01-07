# Guía para Prevenir Errores en el Backend

## ❌ Error: "Assignment to constant variable"

### Problema
Este error ocurre cuando intentas reasignar un valor a una variable declarada con `const` en JavaScript/Node.js.

### Ejemplo del Error
```javascript
// ❌ INCORRECTO - Causa error
const timestamp = fixture.scheduledStartTime || fixture.startTime || 0;
if (timestamp > 1893456000) timestamp = timestamp / 1000; // Error: Assignment to constant variable
```

### Solución
Usa `let` en lugar de `const` cuando necesites reasignar el valor:

```javascript
// ✅ CORRECTO
let timestamp = fixture.scheduledStartTime || fixture.startTime || 0;
if (timestamp > 1893456000) timestamp = timestamp / 1000;
```

O mejor aún, calcula el valor directamente:

```javascript
// ✅ MEJOR - Calcula el valor correcto desde el inicio
const timestamp = (() => {
  const ts = fixture.scheduledStartTime || fixture.startTime || 0;
  return ts > 1893456000 ? ts / 1000 : ts;
})();
```

## 🔍 Qué Revisar en el Backend

### 1. Variables Declaradas con `const` que se Reasignan

**Buscar patrones:**
- `const variable = ...` seguido de `variable = ...`
- Reasignaciones dentro de condicionales o loops

**Archivos a revisar:**
- `src/services/stageProcessor.js` ✅ Corregido
- `src/services/tournamentProcessor.js` ✅ Corregido
- Cualquier archivo que procese timestamps o datos que requieran transformación

### 2. Parámetros de Función que se Modifican

**Problema:**
```javascript
// ❌ INCORRECTO
function processData(data) {
  data = transform(data); // Error si data es const en el scope superior
  return data;
}
```

**Solución:**
```javascript
// ✅ CORRECTO
function processData(data) {
  const transformed = transform(data);
  return transformed;
}
```

### 3. Propiedades de Objetos Inmutables

**Problema:**
```javascript
// ❌ INCORRECTO
const config = Object.freeze({ value: 10 });
config.value = 20; // Error: Cannot assign to read only property
```

**Solución:**
```javascript
// ✅ CORRECTO
const config = { value: 10 };
config.value = 20; // OK si config no es frozen
```

## 📋 Checklist de Revisión

Antes de hacer commit, verifica:

- [ ] No hay reasignaciones de variables `const`
- [ ] Las variables que necesitan ser modificadas usan `let`
- [ ] Los parámetros de función no se modifican directamente
- [ ] Los objetos inmutables no se intentan modificar
- [ ] Los arrays declarados con `const` solo se modifican con métodos (push, pop, etc.), no se reasignan

## 🛠️ Herramientas de Detección

### ESLint Rules
Agrega estas reglas a tu `.eslintrc`:

```json
{
  "rules": {
    "no-const-assign": "error",
    "prefer-const": "warn"
  }
}
```

### Búsqueda Manual
Busca estos patrones en tu código:

```bash
# Buscar posibles reasignaciones de const
grep -r "const.*=" src/ | grep -A 2 "="
```

## 🔧 Correcciones Aplicadas

### Archivos Corregidos:
1. **`src/services/stageProcessor.js`** (línea 70)
   - Cambiado `const timestamp` a `let timestamp`

2. **`src/services/tournamentProcessor.js`** (línea 190)
   - Cambiado `const timestamp` a `let timestamp`

## 📝 Mejores Prácticas

1. **Usa `const` por defecto**: Solo cambia a `let` cuando necesites reasignar
2. **Calcula valores directamente**: En lugar de reasignar, calcula el valor final
3. **Inmutabilidad**: Prefiere crear nuevos objetos/arrays en lugar de modificar existentes
4. **Validación temprana**: Valida y transforma datos al inicio de las funciones

## 🚨 Errores Comunes Relacionados

1. **"Cannot assign to read only property"**: Objeto está congelado o es una constante
2. **"TypeError: Assignment to constant variable"**: Intentando reasignar `const`
3. **"ReferenceError: Cannot access before initialization"**: Uso de `const`/`let` antes de declarar

## 📚 Recursos

- [MDN: const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)
- [MDN: let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)
- [ESLint: no-const-assign](https://eslint.org/docs/latest/rules/no-const-assign)

