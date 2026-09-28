import { useState } from 'react'
import Modal from '../common/Modal'
import InstallGuideStep from './InstallGuideStep'
import InstallGuideTabs from './InstallGuideTabs'

const GUIDES = {
  ios: [
    {
      title: 'Safari에서 공유 버튼을 누르세요',
      image: '/install-guide/ios_step_1.png',
      alt: 'Safari 하단의 공유 버튼 위치',
    },
    {
      title: '공유 메뉴에서 홈 화면에 추가를 누르세요',
      image: '/install-guide/ios_step_2.png',
      alt: 'iOS 공유 메뉴의 홈 화면에 추가 항목',
    },
    {
      title: '오른쪽 위 추가를 누르세요',
      image: '/install-guide/ios_step_3.png',
      alt: 'iOS 홈 화면에 추가 화면의 추가 버튼',
    },
  ],
  android: [
    {
      title: '오른쪽 위 점 3개(⋮)를 누르세요',
      image: '/install-guide/and_step_1.png',
      alt: 'Chrome 오른쪽 위 점 3개 메뉴 위치',
    },
    {
      title: '설치 및 바로가기 만들기를 누르세요',
      image: '/install-guide/and_step_2.png',
      alt: 'Chrome 메뉴의 설치 및 바로가기 만들기 항목',
    },
    {
      title: '설치를 누르세요',
      image: '/install-guide/and_step_3.png',
      alt: '설치 및 바로가기 만들기 화면의 설치 항목',
    },
    {
      title: '설치를 눌러 완료하세요',
      image: '/install-guide/and_step_4.png',
      alt: '홍익냉장고 앱 설치 확인창의 설치 버튼',
    },
  ],
}

export default function InstallGuideModal({ onClose }) {
  const [platform, setPlatform] = useState('ios')
  const guide = GUIDES[platform]

  return (
    <Modal title="앱 설치 방법" titleSpacing="mb-5" onClose={onClose}>
      <InstallGuideTabs value={platform} onChange={setPlatform} />

      <div role="tabpanel" aria-label={`${platform === 'ios' ? 'iOS' : 'Android'} 설치 방법`}>
        {platform === 'android' && (
          <div role="note" className="mb-4 rounded-2xl bg-[#e8f3ff] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--primary)]">
              Chrome 브라우저에서 진행해 주세요
            </p>
            <p className="mt-1 break-keep text-sm leading-relaxed text-[#4e5968]">
              삼성 인터넷에서는 설치 과정에서 보안 경고가 표시될 수 있어요.
            </p>
          </div>
        )}

        <ol className="space-y-4">
          {guide.map((step, index) => (
            <InstallGuideStep
              key={step.image}
              number={index + 1}
              title={step.title}
              image={step.image}
              alt={step.alt}
            />
          ))}
        </ol>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-5 w-full rounded-2xl bg-[var(--primary)] py-4 text-lg font-bold text-white transition-all active:scale-[0.98] motion-reduce:transform-none"
      >
        확인
      </button>
    </Modal>
  )
}
