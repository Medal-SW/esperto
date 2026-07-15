PALAVRA_DO_DIA = "CARBONO"
TESTE = "ACELERACAO"


def avaliar_final(palavra_certa, tentativa):
    tamanho_t = len(tentativa)
    tamanho_c = len(palavra_certa)

    resultado_parcial = [None] * tamanho_t
    usados_certa = [False] * tamanho_c
    contador_ancora = 0

    def ancorar(c_start, c_end, t_start, t_end):
        nonlocal contador_ancora
        if c_start >= c_end or t_start >= t_end:
            return

        maior_tamanho = 0
        melhor_c = -1
        melhor_t = -1

        for i in range(c_start, c_end):
            for j in range(t_start, t_end):
                k = 0
                while (
                    (i + k < c_end)
                    and (j + k < t_end)
                    and (palavra_certa[i + k] == tentativa[j + k])
                ):
                    k += 1

                if k > maior_tamanho:
                    maior_tamanho = k
                    melhor_c = i
                    melhor_t = j

        if maior_tamanho > 0:
            contador_ancora += 1
            id_atual = contador_ancora

            for k in range(maior_tamanho):
                resultado_parcial[melhor_t + k] = ("ordem certa", id_atual)
                usados_certa[melhor_c + k] = True

            ancorar(c_start, melhor_c, t_start, melhor_t)
            ancorar(melhor_c + maior_tamanho, c_end, melhor_t + maior_tamanho, t_end)

    ancorar(0, tamanho_c, 0, tamanho_t)

    # 2. PREENCHIMENTO DO RESTO (Letras soltas)
    for i in range(tamanho_t):
        if resultado_parcial[i] is None:
            letra = tentativa[i]
            achou_errada = False
            for j in range(tamanho_c):
                if palavra_certa[j] == letra and not usados_certa[j]:
                    resultado_parcial[i] = ("ordem errada", None)
                    usados_certa[j] = True
                    achou_errada = True
                    break

            if not achou_errada:
                resultado_parcial[i] = ("nao tem", None)

    # 3. MONTAGEM AGRUPADA
    resultado_final = []
    i = 0

    while i < tamanho_t:
        status, id_ancora = resultado_parcial[i]
        inicio_do_bloco = i

        if id_ancora is not None:
            j = i + 1
            while j < tamanho_t and resultado_parcial[j][1] == id_ancora:
                j += 1
            fim_do_bloco = j - 1
        else:
            j = i + 1
            fim_do_bloco = i

        bloco_texto = tentativa[inicio_do_bloco:j]

        is_ordem_certa = status == "ordem certa"
        is_exists = status != "nao tem"

        is_inicio = (
            inicio_do_bloco == 0 and tentativa[0] == palavra_certa[0] and is_ordem_certa
        )
        is_fim = (
            fim_do_bloco == tamanho_t - 1
            and tentativa[-1] == palavra_certa[-1]
            and is_ordem_certa
        )

        dict_bloco = {
            "substring": bloco_texto,
            "exists": is_exists,
            "ordem_certa": is_ordem_certa,
            "inicio": is_inicio,
            "fim": is_fim,
        }

        resultado_final.append(dict_bloco)
        i = j

    return resultado_final


cenarios_de_teste = [
    ("carbono", "aceleracao"),
    ("missao", "sossego"),
    ("prato", "trapo"),
    ("gato", "lagarto"),
    ("elefante", "telefone"),
]

# cenarios_de_teste = [
#     # 1. Alvo minúsculo, tentativa gigante (Garante que letras extras sejam ignoradas antes e depois da âncora)
#     ("sol", "girassol"),
#     # 2. Inversão total (Anagrama reverso: a maior âncora terá apenas 1 letra de tamanho)
#     ("abcde", "edcba"),
#     # 3. Sobreposição de padrões (Qual "nana" o código vai escolher ancorar?)
#     ("banana", "nanana"),
#     # 4. Excesso absoluto de repetição na tentativa vs alvo pequeno
#     ("a", "aaaaa"),
#     # 5. Intercalação de letras (Testa se o código lida bem com âncoras fragmentadas letra por letra)
#     ("abcd", "axbxcxdx"),
#     # 6. Palíndromo assimétrico (Testa o deslocamento de blocos invertidos)
#     ("ovo", "vovoo"),
#     # 7. Nenhuma correspondência (Para garantir que o código não quebra ao tentar ancorar o vazio)
#     ("python", "java"),
# ]

for palavra_do_dia, palavra in cenarios_de_teste:
    print(avaliar_final(palavra_do_dia, palavra))
    print("")
