import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;

  @media (prefers-color-scheme: dark) {
    background-color: #1a1d21;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LogoImage = styled.div`
  width: 32px;
  height: 32px;
  background-color: ${(props) => props.theme.colors.primary};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
`;

const PlusIcon = styled.div`
  position: relative;
  width: 16px;
  height: 16px;

  &:before,
  &:after {
    content: '';
    position: absolute;
    background-color: white;
  }

  &:before {
    width: 16px;
    height: 2px;
    top: 7px;
    left: 0;
  }

  &:after {
    width: 2px;
    height: 16px;
    left: 7px;
    top: 0;
  }
`;

const Title = styled.h1`
  font-size: 1.125rem;
  font-weight: 500;
  letter-spacing: -0.01em;
`;

export const Header = () => {
  return (
    <HeaderContainer>
      <Logo>
        <LogoImage>
          <PlusIcon />
        </LogoImage>
        <Title>CuraAI</Title>
      </Logo>
    </HeaderContainer>
  );
};
