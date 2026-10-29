Darende Image Converter v3 — iOS / Android / Masaüstü

KURULUM (GitHub Desktop):
1. ZIP'i aç.
2. GitHub Desktop içinden Show in Explorer ile GitHub Pages'i yayınlayan DOĞRU depoyu aç.
3. Bu paketteki index.html, app-v3.js, style-v3.css dosyalarını (README isteğe bağlı) deponun ana klasörüne kopyala. index.html dosyasını değiştirmeyi onayla.
4. Var olan icon.svg, manifest.webmanifest, sw.js, .gitattributes dosyalarını silmen gerekmez. Yeni sürüm eski servis çalışanının kaydını kaldırmaya çalışır.
5. GitHub Desktop içinde Commit to main ve Push origin işlemlerini yap. GitHub Pages yayını tamamlanınca sayfayı şu biçimde aç: https://karacellat334455-ux.github.io/darende-image/?v=3
6. Daha önce ana ekrana eklenmiş eski kısayol güncellenmiyorsa Safari'de yukarıdaki URL'yi doğrudan aç. WhatsApp Business içindeki bağlantı penceresinden değil Safari uygulamasından aç.

YENİLİKLER:
- iPhone/Android için görünür, yerel dosya seçme alanı.
- Fotoğraf seçildiğinde dosya sayısı ve altta önizleme; yüklenemeyen fotoğrafta açıklayıcı uyarı.
- Birden fazla görselin WebP/JPG/PNG'ye dönüştürülmesi ve ayrı indirilmesi.
- Safari WebP üretimini desteklemediğinde WebAssembly tabanlı jSquash/libwebp kodlayıcısı otomatik yüklenir.
- Eski sürümün önbellek için kullandığı service worker kaydını kendi kapsamı için kaldırır.
- Gerçek WebP RIFF/WEBP imzası doğrulaması: PNG'yi WebP adıyla kaydetmez.

ÖNEMLİ NOTLAR:
- WebP yedek kodlayıcı internetten https://esm.sh/@jsquash/webp@1.5.0 adresinden yüklenir; ilk WebP dönüşümünde internet gerekir. Ağ engeli veya bellek sıkıntısında hata bildirir.
- İndirilecek fotoğraflar uygulama kodu tarafından sunucuya gönderilmez; dönüştürme tarayıcıda yapılır. Harici kod yüklenmesi, fotoğrafları başka yere aktarmak için değil, WebP kodlaması içindir.
- HEIC/HEIF okuma desteği cihaz ve tarayıcıya bağlıdır. Tarayıcı okuyamazsa JPEG veya PNG kaynağı kullan.
- iOS Safari/Chrome cihaz testleri henüz yapılmadı. Önce iPhone'da bir JPG fotoğrafıyla fotoğraf seçimi ve önizlemeyi, sonra WebP dönüşümünü test et.
- Yazılım garantili olarak her cihazda çalışır denemez; özellikle eski tarayıcılar, büyük görüntüler ve çevrimdışı çalışma sınırlıdır.

Üçüncü taraf WebP kodlayıcı: @jsquash/webp v1.5.0; Apache-2.0 lisanslıdır. Kaynak: https://github.com/jamsinclair/jSquash
