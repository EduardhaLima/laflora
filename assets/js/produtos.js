/* 9 produtos — coloque as fotos em assets/img/produtos/ com os nomes abaixo.
   Quando o PHP existir, esta lista virá de produtos.php */
const PRODUTOS = [
  { id: "p1", nome: "White Whisper", descricao: "Peônias Brancas & Rosas de Jardim", preco: 89, categoria: "individuais", img: "produto-1.jpg" },
  { id: "p2", nome: "Red Reverie", descricao: "24 Rosas Vermelhas Aveludadas", preco: 94, categoria: "individuais", img: "produto-2.jpg" },
  { id: "p3", nome: "Tulip Carnival", descricao: "Tulipas Holandesas Mistas", preco: 69, categoria: "mix", img: "produto-3.jpg" },
  { id: "p4", nome: "Blush Serenity", descricao: "Lisianthus & Ranúnculos Rosados", preco: 115, categoria: "mix", img: "produto-4.jpg" },
  { id: "p5", nome: "Golden Sunset", descricao: "Girassóis & Folhagens Âmbar", preco: 78, categoria: "mix", img: "produto-5.jpg" },
  { id: "p6", nome: "Orchid Elegance", descricao: "Orquídeas Phalaenopsis Nobres", preco: 139, categoria: "individuais", img: "produto-6.jpg" },
  { id: "p7", nome: "Lavender Dream", descricao: "Lavandas & Eucalipto Prata", preco: 82, categoria: "individuais", img: "produto-7.jpg" },
  { id: "p8", nome: "Garden Party", descricao: "Mix Silvestre de Estação", preco: 99, categoria: "mix", img: "produto-8.jpg" },
  { id: "p9", nome: "Terracotta Hug", descricao: "Rosas Cappuccino & Folhas Secas", preco: 105, categoria: "mix", img: "produto-9.jpg" },
];
const caminhoImg = (p) => "../../assets/img/produtos/" + p.img;
