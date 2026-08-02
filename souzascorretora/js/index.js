const botao = document.querySelector("#botao");

botao.addEventListener('click', () =>{
    window.scroll({top: 700, behavior: "smooth"})
    botao.classList.add("oculto");
})

window.addEventListener("scroll", () => {
  if (window.scrollY < 100) {
    botao.classList.remove("oculto");
  } else if(window.scrollY > 100) {
    botao.classList.add("oculto");
  }
});