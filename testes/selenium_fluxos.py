"""Smoke tests do LaFlora. Execute somente com um banco de teste."""
import os
import secrets
import unittest
from urllib.parse import parse_qs, urlparse

from selenium import webdriver
from selenium.webdriver.common.actions.action_builder import ActionBuilder
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

BASE = os.environ.get("LAFLORA_TEST_URL", "http://localhost:8888").rstrip("/")


class FluxosLaFlora(unittest.TestCase):
    def setUp(self):
        navegador = os.environ.get("LAFLORA_TEST_BROWSER", "chrome")
        if navegador == "safari":
            self.driver = webdriver.Safari()
        else:
            options = webdriver.ChromeOptions()
            options.add_argument("--headless=new")
            self.driver = webdriver.Chrome(options=options)
        self.addCleanup(self.driver.quit)
        self.driver.set_window_size(390, 844)
        self.wait = WebDriverWait(self.driver, 15)
        self.senha = secrets.token_hex(12)

    def abrir(self, tela):
        self.driver.get(f"{BASE}/paginas/{tela}/{tela}.html")

    def visivel(self, seletor):
        return self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, seletor)))

    def clicar(self, seletor):
        botao = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, seletor)))
        botao.send_keys(Keys.ENTER)

    def fechar_pelo_fundo(self, seletor):
        acoes = ActionBuilder(self.driver)
        acoes.pointer_action.move_to_location(4, 4)
        acoes.pointer_action.click()
        acoes.perform()
        self.wait.until_not(EC.presence_of_element_located((By.CSS_SELECTOR, f"{seletor}[open]")))

    def preencher(self, seletor, valor):
        campo = self.visivel(seletor)
        campo.clear()
        campo.send_keys(valor)

    def cadastrar(self):
        email = f"selenium-{secrets.token_hex(6)}@example.test"
        self.abrir("cadastro")
        self.preencher("#nome", "Cliente de teste")
        self.preencher("#email", email)
        self.preencher("#telefone", "81912345678")
        self.preencher("#senha-cad", self.senha)
        self.driver.execute_script("document.getElementById('nascimento').value = '1999-01-01'")
        self.clicar("#form-cadastro button[type=submit]")
        self.wait.until(EC.url_contains("/login/login.html"))
        return email

    def entrar(self, email, senha):
        self.preencher("#email", email)
        self.preencher("#senha", senha)
        self.clicar("#form-login button[type=submit]")
        self.wait.until(EC.url_contains("/catalogo/catalogo.html"))

    def test_cliente_catalogo_chatbot_e_pedido(self):
        email = self.cadastrar()
        self.entrar(email, self.senha)
        self.visivel('[data-add="buque-1"]')
        self.assertFalse(self.driver.find_elements(By.CSS_SELECTOR, "[data-admin-link]"))

        self.visivel(".chat-topo").click()
        self.clicar("[data-iniciar]")
        self.clicar('[data-q="evento"][data-v="jantar"]')
        self.clicar('[data-q="tamanho"][data-v="medio"]')
        self.clicar('[data-q="sentimento"][data-v="felicidade"]')
        self.assertIn("Gérberas", self.visivel(".recomendacao").text)
        self.clicar('[data-satisfacao="sim"]')
        self.clicar('[data-adicionar="sim"]')
        self.wait.until(EC.url_contains("/carrinho/carrinho.html"))
        menu = self.visivel('summary[aria-label="Minha conta"]')
        menu.click()
        self.visivel('[data-modal-conta="configuracoes"]')
        menu.click()
        self.clicar("#finalizar")
        link = self.visivel("#pedido-whatsapp")
        destino = urlparse(link.get_attribute("href"))
        self.assertEqual(destino.hostname, "wa.me")
        resumo = parse_qs(destino.query)["text"][0]
        self.assertRegex(resumo, r"pedido #\d+")
        self.assertIn("1x Buquê de Gérberas", resumo)
        total = resumo.split("Total: ", 1)[1]
        self.assertEqual(total.replace("\xa0", " "), "R$ 104,00")
        self.assertIn("registrado", self.visivel("#pedido-confirmacao").text)

        self.abrir("produtos")
        self.wait.until(EC.url_contains("/catalogo/catalogo.html"))
        status = self.driver.execute_async_script("""
          const done = arguments[0];
          fetch('/api/usuarios.php').then(r => done(r.status)).catch(() => done(0));
        """)
        self.assertEqual(status, 403)

    def test_cliente_edita_perfil_troca_senha_e_desativa_conta(self):
        email = self.cadastrar()
        self.entrar(email, self.senha)
        menu = self.visivel('summary[aria-label="Minha conta"]')
        self.assertFalse(self.driver.find_element(By.CSS_SELECTOR, '[data-modal-conta="perfil"]').is_displayed())
        menu.click()
        self.assertTrue(menu.find_element(By.XPATH, "..").get_property("open"))
        opcao = self.visivel('[data-modal-conta="perfil"]')
        self.assertEqual(opcao.find_element(By.XPATH, "../..").value_of_css_property("position"), "absolute")
        pagina = self.driver.current_url
        self.clicar('[data-modal-conta="perfil"]')
        self.assertEqual(self.visivel("#perfil-email").get_attribute("value"), email)
        self.assertEqual(self.driver.current_url, pagina)
        self.assertFalse(self.driver.find_element(By.ID, "form-senha").is_displayed())
        self.preencher("#perfil-nome", "Perfil revisado")
        novo_email = email.replace("selenium-", "perfil-")
        self.preencher("#perfil-email", novo_email)
        self.preencher("#perfil-telefone", "81987654321")
        self.clicar("#form-perfil button[type=submit]")
        self.wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "#modal-perfil .modal-conta-mensagem"), "Perfil atualizado"))
        self.fechar_pelo_fundo("#modal-perfil")
        self.clicar('[aria-label="Minha conta"]')
        self.clicar('[data-modal-conta="perfil"]')
        self.assertEqual(self.visivel("#perfil-nome").get_attribute("value"), "Perfil revisado")
        self.assertEqual(self.visivel("#perfil-telefone").get_attribute("value"), "81987654321")

        self.clicar("#modal-perfil .modal-conta-fechar")
        self.wait.until_not(EC.presence_of_element_located((By.CSS_SELECTOR, "#modal-perfil[open]")))
        self.clicar('[aria-label="Minha conta"]')
        self.clicar('[data-modal-conta="configuracoes"]')
        self.assertEqual(self.driver.current_url, pagina)
        self.assertFalse(self.driver.find_element(By.ID, "form-perfil").is_displayed())
        senha_nova = secrets.token_hex(12)
        self.preencher("#senha-atual", "senha-incorreta")
        self.preencher("#senha-nova", senha_nova)
        self.preencher("#senha-confirmacao", senha_nova)
        self.clicar("#form-senha button[type=submit]")
        self.wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "#modal-configuracoes .modal-conta-mensagem"), "Senha atual incorreta"))
        self.preencher("#senha-atual", self.senha)
        self.clicar("#form-senha button[type=submit]")
        self.wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "#modal-configuracoes .modal-conta-mensagem"), "Senha alterada"))

        self.fechar_pelo_fundo("#modal-configuracoes")
        self.clicar("#btn-sair")
        self.wait.until(EC.url_contains("/login/login.html"))
        self.entrar(novo_email, senha_nova)
        self.clicar('[aria-label="Minha conta"]')
        self.clicar('[data-modal-conta="configuracoes"]')
        self.clicar("#desativar-conta summary")
        self.preencher("#senha-desativar", senha_nova)
        self.clicar("#form-desativar button[type=submit]")
        self.wait.until(EC.alert_is_present()).accept()
        self.wait.until(EC.url_contains("/login/login.html"))
        self.preencher("#email", novo_email)
        self.preencher("#senha", senha_nova)
        self.clicar("#form-login button[type=submit]")
        self.wait.until(EC.text_to_be_present_in_element((By.ID, "area-avisos"), "E-mail ou senha incorretos"))

    def test_administrador_gerencia_produto_e_usuario_no_celular(self):
        admin = os.environ["LAFLORA_TEST_ADMIN_EMAIL"]
        senha_admin = os.environ["LAFLORA_TEST_ADMIN_PASSWORD"]
        email = self.cadastrar()
        self.entrar(admin, senha_admin)
        self.clicar('[data-admin-link][href*="/produtos/"]')

        produto = f"teste-{secrets.token_hex(6)}"
        self.clicar("#btn-novo-produto")
        for campo, valor in {"id": produto, "nome": "Buquê de teste", "descricao": "Teste Selenium", "preco": "12.50"}.items():
            self.preencher(f"#prod-{campo}", valor)
        Select(self.visivel("#prod-categoria")).select_by_value("mix")
        self.clicar("#form-produto button[type=submit]")
        self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "#modal-produto")))
        self.clicar(f'[data-editar="{produto}"]')
        self.preencher("#prod-nome", "Buquê revisado")
        self.clicar("#form-produto button[type=submit]")
        self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "#modal-produto")))
        self.wait.until(EC.text_to_be_present_in_element((By.ID, "tabela-produtos"), "Buquê revisado"))
        self.clicar(f'[data-desativar="{produto}"]')
        self.wait.until(EC.alert_is_present()).accept()
        self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, f'[data-desativar="{produto}"]')))

        self.clicar('.nav-topo a[href*="/usuarios/"]')
        self.preencher("#busca-usuarios", email)
        self.wait.until(EC.text_to_be_present_in_element((By.ID, "tabela-usuarios"), email))
        linha = f'//tr[td[normalize-space()="{email}"]]'
        self.driver.find_element(By.XPATH, f"{linha}//button[@data-editar]").send_keys(Keys.ENTER)
        self.preencher("#usr-nome", "Cliente revisado")
        self.clicar("#form-usuario button[type=submit]")
        self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "#modal-usuario")))
        self.wait.until(EC.text_to_be_present_in_element((By.XPATH, linha), "Cliente revisado"))
        self.driver.find_element(By.XPATH, f"{linha}//button[@data-desativar]").send_keys(Keys.ENTER)
        self.wait.until(EC.alert_is_present()).accept()
        self.wait.until(EC.text_to_be_present_in_element((By.XPATH, linha), "Inativo"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
