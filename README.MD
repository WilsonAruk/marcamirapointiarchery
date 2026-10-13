Point IA Archery — Registro de Clima
Modal para registrar as condições do tempo ao fim de cada treino. Está em português, usa °C e km/h e traz o logo do app no topo.
Arquivos
```
logo.png          ← coloque aqui o logo do Point IA Archery
index.html        ← página de demonstração
clima/clima.css   ← estilos (cores do logo)
clima/clima.js    ← lógica do modal
```
Como usar no app
Copie a pasta `clima/` e o `logo.png` para o repositório.
Inclua os dois arquivos na página da sessão de treino:
```html
<link rel="stylesheet" href="clima/clima.css">
<script src="clima/clima.js"></script>
```
Ao encerrar o treino, abra o modal:
```js
if (ClimaModal.deveperguntar()) {
  ClimaModal.open({
    logo: 'logo.png',
    onSave: (clima) => { sessao.clima = clima; salvarSessao(sessao); },
    onSkip: () => salvarSessao(sessao)
  });
} else {
  salvarSessao(sessao);
}
```
O que é registrado
Céu: ensolarado, poucas nuvens, nublado, garoa, chuva ou tempestade.
Temperatura (°C) e umidade (%).
Vento: 7 níveis, de calmo (0–5 km/h) a muito forte (50+ km/h).
Direção do vento em relação ao alvo: frente, trás, esquerda, direita e diagonais.
Segunda leitura de vento: opcional.
Observações: campo livre.
Botão "Preencher com o clima atual": usa a API gratuita Open-Meteo (sem chave) e a localização do celular. Se o app estiver publicado, ele precisa rodar em HTTPS para a localização funcionar. O GitHub Pages já usa HTTPS.
Exemplo de dados salvos
```json
{
  "data": "2026-10-13T19:05:00.000Z",
  "ceu": "poucas_nuvens",
  "temperatura": 24,
  "umidade": 62,
  "vento": [
    { "nivel": 3, "nivelNome": "Moderado", "faixaKmh": "20–28 km/h", "direcao": "D", "direcaoNome": "Da direita" }
  ],
  "ventoApi": { "kmh": 22.3, "rajada": 35.6, "graus": 110, "cardeal": "L" },
  "observacoes": "",
  "origem": "automatico",
  "local": { "lat": -23.55, "lon": -46.63 }
}
```
