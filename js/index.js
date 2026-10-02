const botao = document.querySelector("#botao");
const principal = document.querySelector("#principal");

function atualizarSeta() {
  if (window.scrollY < 100) {
    botao.classList.remove("oculto");
  } else {
    botao.classList.add("oculto");
  }
}

botao.addEventListener('click', () => {
    // Antes era window.scroll({top: 700}) — um valor fixo que quebra em telas de outros tamanhos
    principal.scrollIntoView({ behavior: "smooth", block: "start" });
    botao.classList.add("oculto");
});

window.addEventListener("scroll", atualizarSeta);
atualizarSeta();
