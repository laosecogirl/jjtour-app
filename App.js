import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, Modal, TextInput, Linking, ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');
const GOOGLE_SHEET_URL = 'https://opensheet.elk.sh/1Hz3YK59XlflTr9NXsawb72C4DogxWEnFcxkrRe3T9KU/시트1';

// 📝 2단계에서 새로 생성하신 웹 앱 URL 주소를 아래 따옴표 안에 넣어주세요!
const RESERVATION_API_URL = 'https://script.google.com/macros/s/AKfycbytGd_4tdX7V4ZWnv5UTNt78ZckvRAoZ8w8Zz7JONPdTblvBsXtAC3VM-2YB9PhBsnCpw/exec';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [currentScreen, setCurrentScreen] = useState('main'); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState(''); 
  const [userPeople, setUserPeople] = useState(''); // 인원수 저장 변수
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchProducts();
    const timer = setTimeout(() => { setIsLoading(false); }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(GOOGLE_SHEET_URL);
      const parsedProducts = await response.json();
      if (Array.isArray(parsedProducts)) {
        const sanitized = parsedProducts.map((item, idx) => {
          const lowerItem = {};
          Object.keys(item).forEach(key => { lowerItem[key.trim().toLowerCase()] = item[key]; });
          return {
            id: lowerItem.id || String(idx + 1),
            region: lowerItem.region || '지역 정보 없음',
            name: lowerItem.name || '상품명 정보 없음',
            price: lowerItem.price || '가격 문의',
            image: lowerItem.image ? lowerItem.image.trim() : 'https://unsplash.com'
          };
        });
        setProducts(sanitized);
      }
      setIsDataLoading(false);
    } catch (error) {
      setIsDataLoading(false);
    }
  };

  const handleSubmitReservation = async () => {
    if (!userName || !userPhone || !userPeople) {
      alert('모든 항목(이름, 메신저 ID, 인원수)을 입력해 주세요!');
      return;
    }
    setIsSending(true);
    try {
      await fetch(RESERVATION_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
        body: JSON.stringify({
          name: userName,
          phone: userPhone, 
          product: selectedProduct?.name || '선택 상품 없음',
          people: userPeople // 인원수 데이터 추가 발송
        })
      });
      alert(`${userName}님, 상담 신청이 접수되었습니다!\n인원수(${userPeople}명) 확인 후 연락드리겠습니다.`);
      setModalVisible(false); setUserName(''); setUserPhone(''); setUserPeople('');
    } catch (error) {
      alert("신청 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSending(false);
    }
  };
  const handleProductPress = (product) => { setSelectedProduct(product); setCurrentScreen('detail'); };
  const handleBackPress = () => { setCurrentScreen('main'); setSelectedProduct(null); };
  const openTelegram = () => {
    Linking.openURL('https://t.me').catch(() => { alert('텔레그램 앱을 확인해 주세요.'); });
  };

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1e3d2f" />
        <View style={styles.logoCircle}><Image source={require('./logo.png')} style={styles.logoImage} /></View>
        <Text style={styles.splashSubText}>명품 골프 패키지 전문 여행사</Text>
      </View>
    );
  }

  if (currentScreen === 'detail' && selectedProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}><Text style={styles.backButtonText}>← 뒤로</Text></TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>상품 상세 정보</Text><View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.detailContent}>
          <Image source={{ uri: selectedProduct.image }} style={styles.detailImage} />
          <View style={styles.detailInfoContainer}>
            <Text style={styles.cardRegion}>{selectedProduct.region}</Text>
            <Text style={styles.detailName}>{selectedProduct.name}</Text>
            <Text style={styles.detailPrice}>{selectedProduct.price}</Text>
            <View style={styles.divider} />
            <Text style={styles.sectionSubtitle}>⛳ 패키지 핵심 포인트</Text>
            <Text style={styles.detailDescription}>• 엄선된 최고급 명품 골프 코스 라운딩 포함{'\n'}• 전 일정 최고급 호텔 숙박 및 조/석식 제공</Text>
          </View>
        </ScrollView>
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bookButton} activeOpacity={0.8} onPress={() => setModalVisible(true)}><Text style={styles.bookButtonText}>상담 및 예약 신청하기</Text></TouchableOpacity>
        </View>
        <Modal animationType="slide" transparent={true} visible={modalVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>📝 상담 및 예약 신청</Text>
              <Text style={{ fontSize: 13, color: '#666', marginBottom: 15 }}>{selectedProduct.name}</Text>
              <TextInput style={styles.input} placeholder="예약자 성함" value={userName} onChangeText={setUserName} editable={!isSending} />
              <TextInput style={styles.input} placeholder="카카오톡 또는 텔레그램 ID 입력" value={userPhone} onChangeText={setUserPhone} editable={!isSending} autoCapitalize="none" />
              
              {/* 👥 인원수 입력창 추가 */}
              <TextInput style={styles.input} placeholder="예약 인원수 (예: 4)" keyboardType="number-pad" value={userPeople} onChangeText={setUserPeople} editable={!isSending} />
              
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)} disabled={isSending}><Text style={styles.cancelButtonText}>취소</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.submitButton]} onPress={handleSubmitReservation} disabled={isSending}>
                  {isSending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitButtonText}>신청하기</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>JJ TOUR</Text></View>
      {activeTab === 'home' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>추천 골프 패키지</Text>
          {isDataLoading ? (
            <ActivityIndicator size="large" color="#1e3d2f" style={{ marginTop: 50 }} />
          ) : (
            products.map((item) => (
              <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.9} onPress={() => handleProductPress(item)}>
                <Image source={{ uri: item.image }} style={styles.cardImage} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardRegion}>{item.region}</Text>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardPrice}>{item.price}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
      {activeTab === 'reserve' && ( <View style={styles.centerView}><Text style={styles.centerText}>📅 예약 확인 메뉴입니다.</Text></View> )}
      {activeTab === 'center' && (
        <View style={styles.centerView}>
          <Text style={styles.centerText}>📞 JJ TOUR 텔레그램 고객센터</Text>
          <Text style={{color:'#666',marginBottom:20}}>문의 사항은 아래 버튼을 눌러주세요.</Text>
          <TouchableOpacity style={{backgroundColor:'#0088cc',paddingVertical:12,paddingHorizontal:24,borderRadius:20}} onPress={openTelegram}><Text style={{color:'#fff',fontWeight:'bold'}}>💬 텔레그램으로 상담하기</Text></TouchableOpacity>
        </View>
      )}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('home'); handleBackPress(); }}><Text style={styles.tabText}>🏠 홈</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('reserve')}><Text style={styles.tabText}>📅 예약확인</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('center')}><Text style={styles.tabText}>📞 고객센터</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#1e3d2f', justifyContent: 'center', alignItems: 'center' },
  logoCircle: { width: 150, height: 150, backgroundColor: '#ffffff', borderRadius: 75, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  logoImage: { width: 120, height: 120, resizeMode: 'contain' },
  splashSubText: { fontSize: 16, color: '#ffffff', opacity: 0.8, fontWeight: '500' },
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { height: 60, backgroundColor: '#1e3d2f', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  content: { padding: 15, backgroundColor: '#f5f5f5', paddingBottom: 80 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  card: { backgroundColor: '#ffffff', borderRadius: 10, overflow: 'hidden', marginBottom: 20 },
  cardImage: { width: '100%', height: 180 },
  cardInfo: { padding: 15 },
  cardRegion: { fontSize: 12, color: '#2ea44f', fontWeight: 'bold', marginBottom: 5 },
  cardName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  cardPrice: { fontSize: 16, color: '#e65100', fontWeight: 'bold' },
  detailHeader: { height: 60, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 60, paddingLeft: 15 },
  backButtonText: { fontSize: 16, color: '#1e3d2f', fontWeight: '600' },
  detailHeaderTitle: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  detailContent: { backgroundColor: '#ffffff', paddingBottom: 100 },
  detailImage: { width: width, height: 250 },
  detailInfoContainer: { padding: 20 },
  detailName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  detailPrice: { fontSize: 22, color: '#e65100', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  sectionSubtitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3d2f' },
  detailDescription: { fontSize: 14, color: '#555', lineHeight: 22 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, backgroundColor: '#ffffff' },
  bookButton: { backgroundColor: '#1e3d2f', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  bookButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  centerView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  centerText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: '#ffffff', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee' },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 14, color: '#888' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: width * 0.85, backgroundColor: '#ffffff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  input: { height: 48, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, marginBottom: 12 },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, height: 44, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  cancelButton: { backgroundColor: '#f5f5f5', marginRight: 8 },
  cancelButtonText: { color: '#555' },
  submitButton: { backgroundColor: '#1e3d2f', marginLeft: 8 },
  submitButtonText: { color: '#ffffff' }
});
